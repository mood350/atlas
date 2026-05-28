package com.atlas.backend.prospection;

import com.atlas.backend.agency.Agency;
import com.atlas.backend.agency.AgencyRepository;
import com.atlas.backend.client.Client;
import com.atlas.backend.client.ClientRepository;
import com.atlas.backend.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProspectionService {

    private final AgencyRepository agencyRepository;
    private final ClientRepository clientRepository;

    private static final String OVERPASS_URL  = "https://overpass-api.de/api/interpreter";
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private final RestClient restClient = RestClient.create();

    // ─── Catégories → tags OSM ────────────────────────────────────────────────

    private static final Map<String, String[]> CATEGORY_TAGS = new LinkedHashMap<>();

    static {
        // Restauration
        tag("restaurant",          "amenity", "restaurant");
        tag("resto",               "amenity", "restaurant");
        tag("restauration",        "amenity", "restaurant");
        tag("café",                "amenity", "cafe");
        tag("cafe",                "amenity", "cafe");
        tag("bar",                 "amenity", "bar");
        tag("maquis",              "amenity", "bar");
        tag("fast food",           "amenity", "fast_food");
        tag("boulangerie",         "shop",    "bakery");
        tag("pâtisserie",          "shop",    "pastry");
        tag("patisserie",          "shop",    "pastry");
        // Santé
        tag("pharmacie",           "amenity", "pharmacy");
        tag("hôpital",             "amenity", "hospital");
        tag("hopital",             "amenity", "hospital");
        tag("clinique",            "amenity", "clinic");
        tag("cabinet médical",     "amenity", "clinic");
        tag("dentiste",            "amenity", "dentist");
        // Finance
        tag("banque",              "amenity", "bank");
        tag("microfinance",        "amenity", "bank");
        // Commerce
        tag("supermarché",         "shop",    "supermarket");
        tag("supermarche",         "shop",    "supermarket");
        tag("épicerie",            "shop",    "convenience");
        tag("epicerie",            "shop",    "convenience");
        tag("boutique",            "shop",    "clothes");
        tag("téléphonie",          "shop",    "mobile_phone");
        tag("telephonie",          "shop",    "mobile_phone");
        tag("informatique",        "shop",    "computer");
        tag("quincaillerie",       "shop",    "hardware");
        tag("papeterie",           "shop",    "stationery");
        tag("librairie",           "shop",    "books");
        tag("pressing",            "shop",    "laundry");
        tag("laverie",             "shop",    "laundry");
        tag("coiffeur",            "shop",    "hairdresser");
        tag("salon de coiffure",   "shop",    "hairdresser");
        tag("électroménager",      "shop",    "electronics");
        tag("electromenager",      "shop",    "electronics");
        // Auto / transport
        tag("garage",              "shop",    "car_repair");
        tag("station service",     "amenity", "fuel");
        tag("station",             "amenity", "fuel");
        tag("carburant",           "amenity", "fuel");
        // Hébergement
        tag("hôtel",               "tourism", "hotel");
        tag("hotel",               "tourism", "hotel");
        tag("auberge",             "tourism", "hostel");
        tag("gîte",                "tourism", "guest_house");
        tag("gite",                "tourism", "guest_house");
        // Services
        tag("agence immobilière",  "office",  "estate_agent");
        tag("notaire",             "office",  "notary");
        tag("avocat",              "office",  "lawyer");
        tag("comptable",           "office",  "accountant");
        tag("assurance",           "office",  "insurance");
        tag("architecture",        "office",  "architect");
        // Éducation
        tag("école",               "amenity", "school");
        tag("ecole",               "amenity", "school");
        tag("lycée",               "amenity", "school");
        tag("lycee",               "amenity", "school");
        tag("université",          "amenity", "university");
        tag("universite",          "amenity", "university");
        // Autres
        tag("marché",              "amenity", "marketplace");
        tag("marche",              "amenity", "marketplace");
        tag("poste",               "amenity", "post_office");
        tag("parking",             "amenity", "parking");
    }

    private static void tag(String label, String key, String value) {
        CATEGORY_TAGS.put(label.toLowerCase(), new String[]{key, value});
    }

    // ─── Nominatim + Overpass JSON DTOs ──────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Getter @Setter
    private static class NominatimResult {
        private List<String> boundingbox; // [minlat, maxlat, minlon, maxlon] = [S, N, W, E]
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Getter @Setter
    private static class OverpassResponse {
        private List<OverpassElement> elements = new ArrayList<>();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Getter @Setter
    private static class OverpassElement {
        private String type;
        private Long   id;
        private Double lat;
        private Double lon;
        private OverpassCenter center;
        private Map<String, String> tags;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Getter @Setter
    private static class OverpassCenter {
        private Double lat;
        private Double lon;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public ProspectionDto.SearchResponse search(String query, String location) {
        if (query == null || query.isBlank()) {
            return ProspectionDto.SearchResponse.builder().leads(List.of()).build();
        }
        if (location == null || location.isBlank()) {
            throw new IllegalArgumentException(
                    "Indiquez une ville pour la recherche (ex : Lomé, Cotonou, Abidjan).");
        }

        String queryNorm = query.strip().toLowerCase();
        String[] tag     = findCategoryTag(queryNorm);

        String bbox = geocodeBbox(location);
        if (bbox == null) {
            throw new IllegalArgumentException(
                    "Ville introuvable : « " + location + " ». Essayez un nom plus précis.");
        }
        if (!isBboxReasonable(bbox)) {
            throw new IllegalArgumentException(
                    "Zone trop large pour « " + location + " ». Précisez une ville plutôt qu'une région ou un pays.");
        }

        String overpassQ = buildQuery(queryNorm, tag, bbox);

        log.info("[PROSPECTION] Overpass: query='{}' location='{}' bbox={} tag={}", query, location,
                bbox, tag != null ? tag[0] + "=" + tag[1] : "name-search");

        OverpassResponse resp;
        try {
            String encoded = URLEncoder.encode(overpassQ, StandardCharsets.UTF_8);
            resp = restClient.post()
                    .uri(OVERPASS_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body("data=" + encoded)
                    .retrieve()
                    .body(OverpassResponse.class);
        } catch (HttpStatusCodeException e) {
            HttpStatusCode status = e.getStatusCode();
            log.error("[PROSPECTION] Overpass HTTP {}: {}", status.value(), e.getMessage());
            if (status.value() == 504 || status.value() == 429 || status.value() == 503) {
                throw new RuntimeException(
                        "Le serveur OpenStreetMap est surchargé. Précisez davantage votre recherche ou réessayez dans 30 secondes.");
            }
            throw new RuntimeException("Erreur OpenStreetMap (" + status.value() + "). Réessayez bientôt.");
        } catch (Exception e) {
            log.error("[PROSPECTION] Erreur Overpass: {}", e.getMessage());
            throw new RuntimeException(
                    "Erreur lors de la recherche. Réessayez dans quelques secondes.");
        }

        if (resp == null || resp.getElements() == null || resp.getElements().isEmpty()) {
            return ProspectionDto.SearchResponse.builder().leads(List.of()).build();
        }

        List<ProspectionDto.Lead> leads = resp.getElements().stream()
                .map(this::toLeadFrom)
                .filter(Objects::nonNull)
                .filter(l -> l.getName() != null && !l.getName().isBlank())
                .filter(l -> l.getPhone() != null && !l.getPhone().isBlank())
                .limit(100)
                .toList();

        log.info("[PROSPECTION] {} résultats (avec téléphone) pour '{}' à '{}' (sur {} candidats)",
                leads.size(), query, location, resp.getElements().size());
        return ProspectionDto.SearchResponse.builder().leads(leads).build();
    }

    public byte[] exportXlsx(List<ProspectionDto.Lead> leads) {
        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Prospection");

            // ─── Styles ──────────────────────────────────────────────────
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorders(headerStyle);

            CellStyle bodyStyle = wb.createCellStyle();
            applyBorders(bodyStyle);
            bodyStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            bodyStyle.setWrapText(false);

            CellStyle stripeStyle = wb.createCellStyle();
            applyBorders(stripeStyle);
            stripeStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            stripeStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            stripeStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ─── Header row ──────────────────────────────────────────────
            String[] headers = {"Nom", "Adresse", "Téléphone", "Site web"};
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(22);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ─── Data rows (banded) ──────────────────────────────────────
            int row = 1;
            for (ProspectionDto.Lead l : leads) {
                Row r = sheet.createRow(row);
                CellStyle style = (row % 2 == 0) ? stripeStyle : bodyStyle;
                String[] values = {
                        l.getName()    != null ? l.getName()    : "",
                        l.getAddress() != null ? l.getAddress() : "",
                        l.getPhone()   != null ? l.getPhone()   : "",
                        l.getWebsite() != null ? l.getWebsite() : ""
                };
                for (int i = 0; i < values.length; i++) {
                    Cell cell = r.createCell(i);
                    cell.setCellValue(values[i]);
                    cell.setCellStyle(style);
                }
                row++;
            }

            // ─── Table behaviors : filtres + en-tête figée ───────────────
            int lastRow = Math.max(leads.size(), 1);
            sheet.setAutoFilter(new CellRangeAddress(0, lastRow, 0, headers.length - 1));
            sheet.createFreezePane(0, 1);

            // ─── Column widths ───────────────────────────────────────────
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int w = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.min(w + 800, 15000));
            }

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur génération Excel", e);
        }
    }

    private static void applyBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    public ProspectionDto.ImportResponse importLeads(Long agencyId,
                                                      List<ProspectionDto.Lead> leads) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agence introuvable"));

        int imported = 0, skipped = 0;
        for (ProspectionDto.Lead l : leads) {
            if (l.getName() == null || l.getName().isBlank()) { skipped++; continue; }
            if (clientRepository.existsByNameIgnoreCaseAndAgencyId(l.getName(), agencyId)) {
                skipped++; continue;
            }
            Client client = Client.builder()
                    .agency(agency)
                    .name(l.getName())
                    .phoneNumber(l.getPhone())
                    .city(extractCity(l.getAddress()))
                    .type(Client.ClientType.SME)
                    .status(Client.ClientStatus.PROSPECT)
                    .leadSource(Client.LeadSource.COLD_OUTREACH)
                    .notes(buildNotes(l))
                    .build();
            clientRepository.save(client);
            imported++;
        }
        log.info("[PROSPECTION] Import agence={} imported={} skipped={}", agencyId, imported, skipped);
        return ProspectionDto.ImportResponse.builder().imported(imported).skipped(skipped).build();
    }

    // ─── Geocoding (Nominatim) ────────────────────────────────────────────────

    private String geocodeBbox(String location) {
        String cleaned = location.strip();
        String bbox = tryGeocode(cleaned);
        // Fallback : si « Lomé, Togo » échoue, retente avec « Lomé » seul
        if (bbox == null && cleaned.contains(",")) {
            String firstPart = cleaned.substring(0, cleaned.indexOf(",")).strip();
            if (!firstPart.isEmpty()) {
                log.info("[PROSPECTION] Nominatim fallback : '{}' → '{}'", cleaned, firstPart);
                bbox = tryGeocode(firstPart);
            }
        }
        return bbox;
    }

    private String tryGeocode(String location) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                    .queryParam("q", location)
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();
            NominatimResult[] results = restClient.get()
                    .uri(uri)
                    .header("User-Agent", "AtlasCRM/1.0 (princiuso350@gmail.com)")
                    .header("Accept-Language", "fr,en")
                    .retrieve()
                    .body(NominatimResult[].class);
            if (results == null || results.length == 0 || results[0].getBoundingbox() == null
                    || results[0].getBoundingbox().size() < 4) {
                log.warn("[PROSPECTION] Nominatim: aucune bbox pour '{}'", location);
                return null;
            }
            List<String> bb = results[0].getBoundingbox();
            // Nominatim: [minlat, maxlat, minlon, maxlon] = [S, N, W, E]
            // Overpass [bbox:]: south,west,north,east
            String bbox = bb.get(0) + "," + bb.get(2) + "," + bb.get(1) + "," + bb.get(3);
            log.info("[PROSPECTION] Nominatim bbox '{}' → {}", location, bbox);
            return bbox;
        } catch (Exception e) {
            log.warn("[PROSPECTION] Nominatim erreur pour '{}': {}", location, e.getMessage());
            return null;
        }
    }

    /** Refuse les bbox trop grandes (régions/pays) qui font timeout Overpass. */
    private boolean isBboxReasonable(String bbox) {
        try {
            String[] p = bbox.split(",");
            double south = Double.parseDouble(p[0]);
            double west  = Double.parseDouble(p[1]);
            double north = Double.parseDouble(p[2]);
            double east  = Double.parseDouble(p[3]);
            double area = (north - south) * (east - west);
            // 1° × 1° ≈ 110km × 110km à l'équateur — au-delà, Overpass timeout.
            return area > 0 && area <= 1.0;
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Query builder ────────────────────────────────────────────────────────

    private String buildQuery(String queryNorm, String[] tag, String bbox) {
        // bbox injected as global filter: [bbox:south,west,north,east]
        String bboxGlobal = "[bbox:" + bbox + "]";

        if (tag != null) {
            // `nwr` = node, way, relation en une seule expression — plus court et plus rapide
            return String.format(
                "[out:json][timeout:25]%s;\nnwr[\"%s\"=\"%s\"];\nout center 500;",
                bboxGlobal,
                tag[0], tag[1]);
        } else {
            String safe = queryNorm.replace("\"", "").replace("\\", "");
            return String.format(
                "[out:json][timeout:25]%s;\nnwr[\"name\"~\"%s\",i];\nout center 500;",
                bboxGlobal,
                safe);
        }
    }

    // ─── Element → Lead ───────────────────────────────────────────────────────

    private ProspectionDto.Lead toLeadFrom(OverpassElement el) {
        if (el.getTags() == null) return null;
        Map<String, String> t = el.getTags();

        String name = first(t, "name", "name:fr", "official_name");
        if (name == null) return null;

        String phone   = first(t, "phone", "contact:phone", "contact:mobile", "mobile");
        String website = first(t, "website", "contact:website", "url");

        Double lat = el.getLat();
        Double lon = el.getLon();
        if ((lat == null || lon == null) && el.getCenter() != null) {
            lat = el.getCenter().getLat();
            lon = el.getCenter().getLon();
        }

        return ProspectionDto.Lead.builder()
                .placeId("osm-" + el.getType() + "-" + el.getId())
                .name(name)
                .address(buildAddress(t))
                .phone(phone)
                .website(website)
                .lat(lat)
                .lng(lon)
                .build();
    }

    private String buildAddress(Map<String, String> t) {
        String num  = t.get("addr:housenumber");
        String st   = t.get("addr:street");
        String city = t.get("addr:city");
        List<String> parts = new ArrayList<>();
        if (num != null && st != null) parts.add(num + " " + st);
        else if (st != null)           parts.add(st);
        if (city != null)              parts.add(city);
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String[] findCategoryTag(String q) {
        String[] direct = CATEGORY_TAGS.get(q);
        if (direct != null) return direct;
        for (Map.Entry<String, String[]> e : CATEGORY_TAGS.entrySet()) {
            if (q.startsWith(e.getKey()) || e.getKey().startsWith(q)) return e.getValue();
        }
        return null;
    }

    private String first(Map<String, String> tags, String... keys) {
        for (String k : keys) {
            String v = tags.get(k);
            if (v != null && !v.isBlank()) return v.strip();
        }
        return null;
    }

    private String extractCity(String address) {
        if (address == null) return null;
        String[] parts = address.split(",");
        return parts.length >= 2 ? parts[parts.length - 1].strip() : address;
    }

    private String buildNotes(ProspectionDto.Lead l) {
        StringBuilder sb = new StringBuilder("Importé via Prospection OpenStreetMap.");
        if (l.getWebsite() != null) sb.append("\nSite web : ").append(l.getWebsite());
        if (l.getAddress() != null) sb.append("\nAdresse : ").append(l.getAddress());
        return sb.toString();
    }
}
