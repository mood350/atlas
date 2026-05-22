"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuthStore } from "@/stores/auth.store";
import {
  updateMyProfile,
  changePassword,
  updateNotificationPrefs,
} from "@/lib/api/users";
import { extractErrorMessage } from "@/lib/axios";

// ─── Profile form ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
});
type ProfileValues = z.output<typeof profileSchema>;

function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileValues>,
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      timezone: user?.timezone ?? "",
      preferredLanguage: user?.preferredLanguage ?? "",
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  async function onSubmit(values: ProfileValues) {
    try {
      const updated = await updateMyProfile(values);
      patchUser(updated);
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName ? (
            <p className="text-[12px] text-danger">{errors.firstName.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName ? (
            <p className="text-[12px] text-danger">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email ?? ""}
          disabled
          className="opacity-60"
        />
        <p className="text-[12px] text-foreground-muted">
          L&apos;email ne peut pas être changé ici pour des raisons de sécurité.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" {...register("phoneNumber")} placeholder="+229 97 00 00 00" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Fuseau horaire</Label>
          <Input
            id="timezone"
            {...register("timezone")}
            placeholder="Africa/Cotonou"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lang">Langue</Label>
          <Input
            id="lang"
            {...register("preferredLanguage")}
            placeholder="fr"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full active:scale-95 transition-transform"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

// ─── Password form ────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(8, "8 caractères minimum"),
    confirmNewPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmNewPassword"],
  });
type PasswordValues = z.output<typeof passwordSchema>;

function PasswordForm() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordValues>,
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  async function onSubmit(values: PasswordValues) {
    try {
      await changePassword(values);
      toast.success("Mot de passe modifié");
      reset();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cur-pass">Mot de passe actuel</Label>
        <Input id="cur-pass" type="password" {...register("currentPassword")} />
        {errors.currentPassword ? (
          <p className="text-[12px] text-danger">{errors.currentPassword.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-pass">Nouveau mot de passe</Label>
        <Input id="new-pass" type="password" {...register("newPassword")} />
        {errors.newPassword ? (
          <p className="text-[12px] text-danger">{errors.newPassword.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-pass">Confirmer</Label>
        <Input id="confirm-pass" type="password" {...register("confirmNewPassword")} />
        {errors.confirmNewPassword ? (
          <p className="text-[12px] text-danger">{errors.confirmNewPassword.message}</p>
        ) : null}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full active:scale-95 transition-transform"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Modifier le mot de passe
        </Button>
      </div>
    </form>
  );
}

// ─── Notifications form ───────────────────────────────────────────────────────

function NotificationsForm() {
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [email, setEmail] = useState(user?.emailNotificationsEnabled ?? true);
  const [sms, setSms] = useState(user?.smsNotificationsEnabled ?? false);
  const [whatsapp, setWhatsapp] = useState(user?.whatsappNotificationsEnabled ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateNotificationPrefs({
        emailNotificationsEnabled: email,
        smsNotificationsEnabled: sms,
        whatsappNotificationsEnabled: whatsapp,
      });
      patchUser(updated);
      toast.success("Préférences enregistrées");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Notifications email</p>
          <p className="caption-14 text-foreground-muted">
            Reçois les alertes par email
          </p>
        </div>
        <Switch checked={email} onCheckedChange={setEmail} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Notifications SMS</p>
          <p className="caption-14 text-foreground-muted">
            Reçois les alertes par SMS
          </p>
        </div>
        <Switch checked={sms} onCheckedChange={setSms} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Notifications WhatsApp</p>
          <p className="caption-14 text-foreground-muted">
            Reçois les alertes sur WhatsApp
          </p>
        </div>
        <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
      </div>

      <div className="pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full active:scale-95 transition-transform"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const agency = useAuthStore((s) => s.agency);
  usePageTitle("Paramètres", "Gérez votre profil et vos préférences");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Agency badge */}
      {agency ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="caption-14 text-foreground-muted">Agence</p>
          <p className="mt-0.5 text-[18px] font-semibold text-foreground">{agency.name}</p>
          <p className="caption-14 text-foreground-muted">
            {user?.email}
            {user?.roles?.[0] ? ` · ${user.roles[0]}` : ""}
          </p>
        </div>
      ) : null}

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="password">Mot de passe</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px]">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="border-border-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px]">Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px]">Préférences de notification</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
