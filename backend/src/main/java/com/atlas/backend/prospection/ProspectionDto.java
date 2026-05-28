package com.atlas.backend.prospection;

import lombok.*;

import java.util.List;

public class ProspectionDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Lead {
        private String  placeId;
        private String  name;
        private String  address;
        private String  phone;
        private String  website;
        private Double  rating;
        private Integer reviewCount;
        private Double  lat;
        private Double  lng;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SearchResponse {
        private List<Lead> leads;
        private String     nextPageToken;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ExportRequest {
        private List<Lead> leads;
        private String     filename;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ImportRequest {
        private List<Lead> leads;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImportResponse {
        private int imported;
        private int skipped;
    }
}
