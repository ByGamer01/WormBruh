"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, Edit } from "lucide-react"
import { toast } from "sonner"

export function ProfileSettings() {
  const { user, logout } = usePrivy()
  const { profile, loading, refetch } = useUserProfile()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleEdit = () => {
    if (profile) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setEditing(true)
    }
  }

  const handleSave = async () => {
    if (!profile || !user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          username: username.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        toast.error("Error al actualizar el perfil")
      } else {
        toast.success("Perfil actualizado exitosamente")
        setEditing(false)
        refetch()
      }
    } catch (error) {
      console.error("Error in handleSave:", error)
      toast.error("Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setDisplayName("")
    setUsername("")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-3 bg-muted rounded w-48"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Mi Perfil
        </CardTitle>
        <CardDescription>Gestiona tu información personal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar y información básica */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-lg">
              {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.address?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="text-lg font-semibold">
              {profile?.display_name || user?.email?.address?.split("@")[0] || "Usuario"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {user?.email?.address}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Miembro desde {new Date(profile?.created_at || "").toLocaleDateString("es-ES")}
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Nombre para mostrar</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre para mostrar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario único"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre para mostrar</Label>
                <div className="text-sm">{profile?.display_name || "No configurado"}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Nombre de usuario</Label>
                <div className="text-sm">{profile?.username || "No configurado"}</div>
              </div>
            </div>
            <Button onClick={handleEdit} variant="outline" className="w-full bg-transparent">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        )}

        {/* Acciones de cuenta */}
        <div className="pt-4 border-t">
          <Button onClick={logout} variant="destructive" className="w-full">
            Cerrar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
