"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Header, Button, Input, NotificationManager } from "@/components/admin";
import { useTheme } from "@/hooks/useTheme";
import { colors as themeColors } from "@/lib/theme";
import { motion } from "framer-motion";
import { Palette, Moon, Sun, Save, RefreshCw } from "lucide-react";

export default function ConfiguracionPage() {
  const { 
    theme, 
    isDarkMode, 
    toggleDarkMode, 
    updateBranding, 
    primaryColor, 
    logoUrl, 
    nombreClinica,
    setLogoUrl,
    setNombreClinica
  } = useTheme();

  const [localPrimaryColor, setLocalPrimaryColor] = useState(primaryColor);
  const [localNombreClinica, setLocalNombreClinica] = useState(nombreClinica);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl);

  const [membretadaFile, setMembretadaFile] = useState<File | null>(null);
  const [membretadaPreview, setMembretadaPreview] = useState<string | null>(null); // Cargaremos del config si existe

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setLocalPrimaryColor(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    setLocalNombreClinica(nombreClinica);
  }, [nombreClinica]);

  useEffect(() => {
    setLogoPreview(logoUrl);
  }, [logoUrl]);

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    setNotifications((prev) => [...prev, { id: Date.now().toString(), message, type }]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      let finalLogoUrl = logoUrl;
      let finalMembretadaUrl = null;

      // 1. Upload Logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${session.user.id}_logo_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("branding")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("branding")
          .getPublicUrl(fileName);
        
        finalLogoUrl = publicUrl;
      }

      // 2. Upload Membretada if changed
      if (membretadaFile) {
        const fileExt = membretadaFile.name.split(".").pop();
        const fileName = `${session.user.id}_membretada_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("branding")
          .upload(fileName, membretadaFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("branding")
          .getPublicUrl(fileName);
        
        finalMembretadaUrl = publicUrl;
      }

      // 3. Update Database
      const updateData: any = {
        color_primario: localPrimaryColor,
        nombre_clinica: localNombreClinica,
        logo_url: finalLogoUrl,
        updated_at: new Date().toISOString()
      };

      if (finalMembretadaUrl) {
        updateData.membretada_url = finalMembretadaUrl;
      }

      const { error } = await supabase
        .from("configuracion_branding")
        .update(updateData)
        .eq("terapeuta_id", session.user.id);

      if (error) throw error;

      // Update Local State
      setLogoUrl(finalLogoUrl);
      setNombreClinica(localNombreClinica);
      await updateBranding(localPrimaryColor);
      
      addNotification("Configuración guardada exitosamente", "success");
    } catch (error: any) {
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleMembretadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMembretadaFile(file);
      setMembretadaPreview(URL.createObjectURL(file));
    }
  };

  const presets = [
    { name: "Rosa Lili (Original)", color: "#D4A5A5" },
    { name: "Azul Profesional", color: "#4A90E2" },
    { name: "Verde Salud", color: "#2ECC71" },
    { name: "Púrpura Elegante", color: "#9B59B6" },
    { name: "Gris Moderno", color: "#34495E" },
    { name: "Naranja Energía", color: "#E67E22" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.background }}>
      <NotificationManager 
        notifications={notifications} 
        onRemove={(id) => setNotifications(n => n.filter(x => x.id !== id))} 
      />
      
      <Header 
        title="Configuración de Perfil" 
        subtitle="Personaliza tu espacio de trabajo y branding"
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Branding Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-2xl shadow-sm border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.primaryLight }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6" style={{ color: themeColors.primary }} />
              <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Branding Personalizado</h2>
            </div>

            <p className="text-sm mb-6" style={{ color: themeColors.textMuted }}>
              Elige el color principal de tu plataforma. Este color se aplicará a botones, menús y acentos en toda la aplicación.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                  Nombre de la Clínica / Consultorio
                </label>
                <Input 
                  value={localNombreClinica}
                  onChange={(e) => setLocalNombreClinica(e.target.value)}
                  placeholder="Ej. Clínica Psicológica Terhfam"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                  Logo Personalizado
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50"
                    style={{ borderColor: themeColors.primaryLight }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Palette className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="inline-block px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.primary,
                        color: themeColors.primary
                      }}
                    >
                      Seleccionar Imagen
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2">Formatos aceptados: PNG, JPG (Máx 2MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                  Hoja Membretada (Fondo para PDFs)
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-24 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50"
                    style={{ borderColor: themeColors.primaryLight }}
                  >
                    {membretadaPreview ? (
                      <img src={membretadaPreview} alt="Membretada" className="w-full h-full object-cover" />
                    ) : (
                      <Palette className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="membretada-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleMembretadaChange}
                    />
                    <label 
                      htmlFor="membretada-upload"
                      className="inline-block px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.primary,
                        color: themeColors.primary
                      }}
                    >
                      Cargar Fondo PDF
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2">Se usará como fondo en todas las hojas de tus documentos.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                  Color Primario
                </label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={localPrimaryColor}
                    onChange={(e) => setLocalPrimaryColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2"
                    style={{ borderColor: themeColors.primaryLight }}
                  />
                  <Input 
                    value={localPrimaryColor}
                    onChange={(e) => setLocalPrimaryColor(e.target.value)}
                    placeholder="#hexadecimal"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: themeColors.text }}>
                  Presets Rápidos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => setLocalPrimaryColor(preset.color)}
                      className="p-2 rounded-lg text-xs font-medium border transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: preset.color === localPrimaryColor ? preset.color : "transparent",
                        color: preset.color === localPrimaryColor ? "white" : themeColors.text,
                        borderColor: preset.color
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: themeColors.primaryLight }}>
                <Button 
                  onClick={handleSave} 
                  disabled={loading || (localPrimaryColor === primaryColor && localNombreClinica === nombreClinica && !logoFile && !membretadaFile)}
                  className="w-full flex items-center justify-center gap-2"
                >
"
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? "Guardando Configuración..." : "Guardar y Aplicar"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-2xl shadow-sm border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.primaryLight }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sun className="w-6 h-6" style={{ color: themeColors.primary }} />
              <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Preferencias de Interfaz</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: themeColors.background, borderColor: themeColors.primaryLight }}>
                <div>
                  <p className="font-bold" style={{ color: themeColors.text }}>Modo Oscuro</p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Cambia la apariencia de la interfaz</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="p-3 rounded-full transition-all hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: themeColors.primary }}
                >
                  {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                  <span>⚠️</span> Nota de Seguridad
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Tus datos están protegidos por Row Level Security (RLS). Solo tú puedes ver tus pacientes y documentos generados.
                </p>
              </div>
            </div>

            {/* Preview Box */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: themeColors.textMuted }}>Vista Previa</p>
              <div 
                className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                style={{ borderColor: localPrimaryColor }}
              >
                <div className="w-full h-2 rounded bg-gray-200 animate-pulse" />
                <div className="w-3/4 h-2 rounded bg-gray-200 animate-pulse" />
                <Button size="sm" style={{ backgroundColor: localPrimaryColor }}>Botón de Ejemplo</Button>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
