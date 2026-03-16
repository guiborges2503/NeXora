import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Upload, Save } from "lucide-react";
import { apiGet, apiPatch } from "@/config/api";
import { getRoleLabel, getStoredUser, getUserInitials } from "@/config/currentUser";

type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  job_title: string;
  avatar_url: string;
};

export function ProfilePage() {
  const storedUser = getStoredUser();
  const userId = Number(storedUser?.id ?? 0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [role, setRole] = useState("viewer");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState<boolean | null>(null);
  const [isVerifyingCurrentPassword, setIsVerifyingCurrentPassword] = useState(false);

  const [initialSnapshot, setInitialSnapshot] = useState<ProfileResponse | null>(null);

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function getPhoneDigits(value: string): string {
    return value.replace(/\D/g, "");
  }

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!userId) {
        setErrorMessage("Usuário não identificado. Faça login novamente.");
        setIsLoading(false);
        return;
      }

      try {
        const profile = await apiGet<ProfileResponse>(`/profile.php?user_id=${userId}`);
        if (!mounted) return;

        setInitialSnapshot(profile);
        setRole(profile.role);
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setEmail(profile.email ?? "");
        setPhone(profile.phone ?? "");
        setJobTitle(profile.job_title ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Não foi possível carregar seu perfil."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const roleLabel = useMemo(() => getRoleLabel(role), [role]);
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = getUserInitials(fullName);
  const isPasswordFilled = currentPassword !== "" || newPassword !== "" || confirmPassword !== "";

  function resetFormToSnapshot() {
    if (!initialSnapshot) return;
    setFirstName(initialSnapshot.first_name ?? "");
    setLastName(initialSnapshot.last_name ?? "");
    setEmail(initialSnapshot.email ?? "");
    setPhone(initialSnapshot.phone ?? "");
    setJobTitle(initialSnapshot.job_title ?? "");
    setAvatarUrl(initialSnapshot.avatar_url ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsCurrentPasswordValid(null);
    setIsVerifyingCurrentPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleChangeAvatar() {
    const value = window.prompt("Informe a URL da foto de perfil:", avatarUrl);
    if (value === null) return;
    setAvatarUrl(value.trim());
  }

  async function handleSaveProfile() {
    if (!userId) {
      setErrorMessage("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (firstName.trim() === "") {
      setErrorMessage("Informe ao menos o nome.");
      return;
    }

    const phoneDigits = getPhoneDigits(phone);
    if (phoneDigits !== "" && phoneDigits.length < 10) {
      setErrorMessage("Informe um telefone válido com DDD.");
      return;
    }

    if (isPasswordFilled) {
      if (currentPassword === "") {
        setErrorMessage("Informe a senha atual para alterar a senha.");
        return;
      }
      if (isCurrentPasswordValid !== true) {
        setErrorMessage("Valide a senha atual corretamente para alterar a senha.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("A nova senha deve ter ao menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("A confirmação da nova senha não confere.");
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedProfile = await apiPatch<
        ProfileResponse,
        {
          action: "update_profile";
          user_id: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          job_title: string;
          avatar_url: string;
        }
      >("/profile.php", {
        action: "update_profile",
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        job_title: jobTitle.trim(),
        avatar_url: avatarUrl.trim(),
      });

      if (isPasswordFilled) {
        await apiPatch<
          { ok?: boolean },
          {
            action: "change_password";
            user_id: number;
            current_password: string;
            new_password: string;
          }
        >("/profile.php", {
          action: "change_password",
          user_id: userId,
          current_password: currentPassword,
          new_password: newPassword,
        });
      }

      setInitialSnapshot(updatedProfile);
      setRole(updatedProfile.role);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsCurrentPasswordValid(null);
      setIsVerifyingCurrentPassword(false);
      setSuccessMessage(
        isPasswordFilled
          ? "Perfil e senha atualizados com sucesso."
          : "Perfil atualizado com sucesso."
      );

      const latestUser = getStoredUser() ?? {};
      localStorage.setItem(
        "nexora_user",
        JSON.stringify({
          ...latestUser,
          id: updatedProfile.id,
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
          avatar_url: updatedProfile.avatar_url,
        })
      );
      window.dispatchEvent(new Event("nexora-user-updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível salvar as alterações."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVerifyCurrentPassword() {
    if (!userId || currentPassword.trim() === "") {
      setIsCurrentPasswordValid(null);
      return;
    }

    setIsVerifyingCurrentPassword(true);
    try {
      await apiPatch<
        { valid: boolean },
        {
          action: "verify_current_password";
          user_id: number;
          current_password: string;
        }
      >("/profile.php", {
        action: "verify_current_password",
        user_id: userId,
        current_password: currentPassword,
      });
      setIsCurrentPasswordValid(true);
      setErrorMessage("");
    } catch (error) {
      setIsCurrentPasswordValid(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível validar a senha atual."
      );
    } finally {
      setIsVerifyingCurrentPassword(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize seus dados pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando perfil...</p> : null}

          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || "Usuário"} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials || "US"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" onClick={handleChangeAvatar} disabled={isLoading}>
                <Upload className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Informe uma URL de imagem para foto do perfil
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first-name">Nome</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="bg-input-background border-border"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Sobrenome</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="bg-input-background border-border"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10 bg-input-background border-border"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(formatPhone(event.target.value))}
                inputMode="numeric"
                placeholder="(11) 98765-4321"
                className="bg-input-background border-border"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="bg-input-background border-border"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configurações da Conta
          </CardTitle>
          <CardDescription>Gerencie sua conta e permissões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Nível de Acesso</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Alterar Senha</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  className="bg-input-background border-border"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setIsCurrentPasswordValid(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  onBlur={() => {
                    void handleVerifyCurrentPassword();
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                  name="nexora-current-password"
                />
                {isVerifyingCurrentPassword ? (
                  <p className="text-xs text-muted-foreground">Validando senha atual...</p>
                ) : null}
                {isCurrentPasswordValid === true ? (
                  <p className="text-xs text-emerald-600">Senha atual validada.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="bg-input-background border-border"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={isLoading || isCurrentPasswordValid !== true}
                    autoComplete="off"
                    name="nexora-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="bg-input-background border-border"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isLoading || isCurrentPasswordValid !== true}
                    autoComplete="off"
                    name="nexora-confirm-password"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={resetFormToSnapshot}
          disabled={isLoading || isSaving}
        >
          Cancelar
        </Button>
        <Button size="lg" onClick={handleSaveProfile} disabled={isLoading || isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
