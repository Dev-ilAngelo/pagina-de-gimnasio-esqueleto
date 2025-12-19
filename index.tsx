
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, MapPin, CreditCard, BarChart3, Search, Plus, 
  ShieldCheck, BrainCircuit, TrendingUp, X, ChevronRight, Activity,
  Database, Layout, Code2
} from 'lucide-react';

/**
 * --- LECCIÓN 1: TIPADO DE DATOS (REEMPLAZA STRUCTS DE C) ---
 * En C usamos múltiples arreglos o un 'struct'. En TypeScript definimos una 'interface'.
 * Esto garantiza "Type Safety": el compilador nos avisa si intentamos asignar un texto a un número.
 * Es como un contrato que dice qué forma tiene un "Socio".
 */
interface Socio {
  id: string;
  nombre: string;
  dni: number;
  edad: number;
  sede: string;
  membresia: string;
  metodoPago: string;
  importe: number;
}

const SEDES = ["CBA", "ROS", "MDP", "BUE"];
const MEMBRESIAS = [
  { id: "BAS", precio: 12000, nombre: "Básica" },
  { id: "STD", precio: 18000, nombre: "Standard" },
  { id: "PRE", precio: 25000, nombre: "Premium" }
];

const MAX_SOCIOS = 390;

/**
 * --- LECCIÓN 2: LÓGICA DE NEGOCIO ENCAPSULADA (DRY - Don't Repeat Yourself) ---
 * Separamos el cálculo matemático de la parte visual. 
 * Esta clase es el "cerebro". Si mañana cambian los precios, solo se toca aquí.
 * Comparación con C: Aquí no pasas punteros, retornas valores directamente.
 */
class FitnessBusinessLogic {
  static calcularImporte(edad: number, membresiaId: string, metodoPago: string): number {
    const membresia = MEMBRESIAS.find(m => m.id === membresiaId);
    let costo = membresia ? membresia.precio : 0;

    // Lógica heredada del C: Descuento menores de 18
    if (edad < 18) costo *= 0.8;
    
    // Lógica heredada del C: Recargo por tarjeta
    if (metodoPago === "tarjeta") costo *= 1.05;

    return costo;
  }
}

// --- COMPONENTES UI ANIMADOS ---

const AnimatedCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const App = () => {
  /**
   * --- LECCIÓN 3: ESTADO DINÁMICO (React Hooks) ---
   * En C, los datos están en memoria estática o archivos. 
   * En React, 'useState' crea una variable reactiva. 
   * Si 'socios' cambia, React redibuja solo la parte necesaria de la pantalla.
   */
  const [socios, setSocios] = useState<Socio[]>([]);
  const [view, setView] = useState<'dashboard' | 'list' | 'add'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Formulario local
  const [formData, setFormData] = useState({
    nombre: '', dni: '', edad: '', sede: 'CBA', membresia: 'BAS', metodoPago: 'efectivo'
  });

  /**
   * --- LECCIÓN 4: PERSISTENCIA (Simulación de DB) ---
   * 'useEffect' es un "gancho" que se ejecuta al cargar la app.
   * Usamos 'localStorage' para que los datos no se borren al refrescar.
   */
  useEffect(() => {
    const saved = localStorage.getItem('fitness_plus_elite_v3');
    if (saved) setSocios(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('fitness_plus_elite_v3', JSON.stringify(socios));
  }, [socios]);

  /**
   * --- LECCIÓN 5: CÓMPUTO OPTIMIZADO (Programación Funcional) ---
   * En C usarías bucles 'for' complejos. Aquí usamos '.reduce' y '.map'.
   * Es más legible, elegante y propenso a menos errores de índice.
   */
  const stats = useMemo(() => {
    const totalRecaudado = socios.reduce((acc, s) => acc + s.importe, 0);
    const sedeBreakdown = SEDES.map(sede => {
      const sSede = socios.filter(s => s.sede === sede);
      return { 
        name: sede, 
        count: sSede.length, 
        income: sSede.reduce((acc, s) => acc + s.importe, 0) 
      };
    });
    const totalSocios = socios.length;
    return { totalRecaudado, totalSocios, sedeBreakdown };
  }, [socios]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const dni = parseInt(formData.dni);
    const edad = parseInt(formData.edad);

    if (dni < 2000000 || dni > 59999999) return alert("Error: DNI inválido para el sistema ministerial.");
    if (socios.length >= MAX_SOCIOS) return alert("Alerta: Capacidad máxima excedida.");

    const nuevo: Socio = {
      id: crypto.randomUUID(),
      nombre: formData.nombre,
      dni, edad,
      sede: formData.sede,
      membresia: formData.membresia,
      metodoPago: formData.metodoPago,
      importe: FitnessBusinessLogic.calcularImporte(edad, formData.membresia, formData.metodoPago)
    };

    setSocios([nuevo, ...socios]);
    setView('list');
    setFormData({ nombre: '', dni: '', edad: '', sede: 'CBA', membresia: 'BAS', metodoPago: 'efectivo' });
  };

  const askAI = async () => {
    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Actúa como un CEO de tecnología. Analiza mis estadísticas de gimnasio: 
      Socios: ${stats.totalSocios}, Recaudación: $${stats.totalRecaudado}.
      Sedes: ${JSON.stringify(stats.sedeBreakdown)}.
      Dame un consejo estratégico disruptivo para triplicar mis ingresos. Sé breve.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      setAiInsight(response.text);
    } catch (e) { 
      setAiInsight("Error de red neural. Reintentar."); 
    } finally { 
      setLoadingAI(false); 
    }
  };

  const filteredSocios = socios.filter(s => 
    s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.dni.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen flex text-zinc-100 selection:bg-blue-500/30">
      {/* SIDEBAR ELITE NAV */}
      <nav className="w-20 lg:w-72 bg-zinc-950/90 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 fixed h-full z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-16"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Activity className="text-white w-7 h-7" />
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-xl tracking-tighter leading-none">FITNESS<span className="text-blue-500">PRO</span></h2>
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Elite Management</span>
          </div>
        </motion.div>

        <div className="flex-1 space-y-4">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'list', icon: Users, label: 'Gestión Socios' },
            { id: 'add', icon: Plus, label: 'Nueva Alta' }
          ].map((item, idx) => (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                view === item.id ? 'text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {view === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-blue-600 rounded-2xl -z-10 shadow-lg shadow-blue-600/20"
                />
              )}
              <item.icon className={`w-5 h-5 ${view === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <span className="hidden lg:block font-bold text-sm tracking-tight">{item.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-auto space-y-6 pt-6 border-t border-white/5">
          <div className="hidden lg:block p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
            <div className="flex justify-between text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">
              <span>Capacidad</span>
              <span>{Math.round((socios.length/MAX_SOCIOS)*100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(socios.length/MAX_SOCIOS)*100}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
              />
            </div>
          </div>
          <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] text-center lg:text-left">
            V 2.5 • Enterprise Edition
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-12 relative">
        <div className="max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dash"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-2">Visión <span className="text-blue-500">Global</span></h1>
                    <p className="text-zinc-500 font-medium">Análisis de rendimiento y rentabilidad en tiempo real.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnimatedCard delay={0.1} className="flex flex-col justify-between h-48">
                    <TrendingUp className="text-emerald-400 w-8 h-8" />
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Recaudación</p>
                      <h3 className="text-4xl font-black">${stats.totalRecaudado.toLocaleString()}</h3>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard delay={0.2} className="flex flex-col justify-between h-48">
                    <Users className="text-blue-400 w-8 h-8" />
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Socios Activos</p>
                      <h3 className="text-4xl font-black">{stats.totalSocios}</h3>
                    </div>
                  </AnimatedCard>

                  <AnimatedCard delay={0.3} className="border-blue-500/30 bg-blue-500/5 group">
                    <div className="flex items-center gap-3 mb-4">
                      <BrainCircuit className="text-blue-400 w-6 h-6 animate-pulse" />
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Consultoría IA</span>
                    </div>
                    {aiInsight ? (
                      <div className="text-sm font-medium leading-relaxed animate-in fade-in zoom-in duration-500">
                        "{aiInsight}"
                        <button onClick={() => setAiInsight(null)} className="block mt-4 text-xs text-blue-500 hover:underline">Nuevo análisis</button>
                      </div>
                    ) : (
                      <button 
                        onClick={askAI}
                        disabled={loadingAI}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {loadingAI ? "Pensando..." : "Analizar Negocio"}
                      </button>
                    )}
                  </AnimatedCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnimatedCard delay={0.4} className="col-span-1">
                    <h3 className="font-black text-xl mb-6">Rendimiento por Sede</h3>
                    <div className="space-y-6">
                      {stats.sedeBreakdown.map((s, i) => (
                        <div key={s.name}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold">{s.name}</span>
                            <span className="text-zinc-500 font-mono">${s.income.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.income / (stats.totalRecaudado || 1)) * 100}%` }}
                              transition={{ delay: 0.5 + (i*0.1) }}
                              className="h-full bg-blue-500" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimatedCard>
                  
                  <AnimatedCard delay={0.5} className="bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-center p-12">
                     <Database className="w-12 h-12 text-zinc-700 mb-6" />
                     <h4 className="text-lg font-bold mb-2 text-zinc-400">Escalabilidad Enterprise</h4>
                     <p className="text-sm text-zinc-600">Este sistema soporta hasta 100 sedes en simultáneo mediante una base de datos distribuida (Concepto avanzado).</p>
                  </AnimatedCard>
                </div>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <h1 className="text-4xl font-black tracking-tighter">Padrón <span className="text-blue-500">Elite</span></h1>
                  <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Buscar por DNI o Nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-xl shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
                        <th className="px-8 py-5">Nombre / Edad</th>
                        <th className="px-8 py-5">DNI</th>
                        <th className="px-8 py-5">Ubicación</th>
                        <th className="px-8 py-5">Membresía</th>
                        <th className="px-8 py-5 text-right">Importe</th>
                        <th className="px-8 py-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredSocios.map((s, i) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={s.id} 
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="font-bold text-zinc-200">{s.nombre}</div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{s.edad} años</div>
                          </td>
                          <td className="px-8 py-6 font-mono text-xs text-zinc-400 tracking-tighter">{s.dni}</td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black bg-zinc-800 px-3 py-1 rounded-full text-zinc-300 ring-1 ring-white/5">{s.sede}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black tracking-widest uppercase ${
                              s.membresia === 'PRE' ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                              {MEMBRESIAS.find(m => m.id === s.membresia)?.nombre}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-emerald-400">
                            ${s.importe.toFixed(0)}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button 
                              onClick={() => setSocios(socios.filter(x => x.id !== s.id))}
                              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSocios.length === 0 && (
                    <div className="p-20 text-center">
                      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Users className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 font-medium">No se encontraron registros en la base de datos.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'add' && (
              <motion.div 
                key="add"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-black tracking-tighter mb-4">Registro de <span className="text-blue-500">Elite</span></h1>
                  <p className="text-zinc-500">Complete los campos para integrar un nuevo socio al sistema.</p>
                </div>

                <AnimatedCard className="!p-10 border-blue-500/20 shadow-blue-900/10">
                  <form onSubmit={handleRegister} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre Completo del Cliente</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-lg"
                        placeholder="Ej: Marcelo Alexander Sosa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Documento Nacional (DNI)</label>
                        <input 
                          required
                          type="number" 
                          value={formData.dni}
                          onChange={(e) => setFormData({...formData, dni: e.target.value})}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="Sin puntos"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Edad Cronológica</label>
                        <input 
                          required
                          type="number" 
                          value={formData.edad}
                          onChange={(e) => setFormData({...formData, edad: e.target.value})}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="18"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sede Asignada</label>
                        <select 
                          value={formData.sede}
                          onChange={(e) => setFormData({...formData, sede: e.target.value})}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold cursor-pointer"
                        >
                          {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Categoría Membresía</label>
                        <select 
                          value={formData.membresia}
                          onChange={(e) => setFormData({...formData, membresia: e.target.value})}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold cursor-pointer"
                        >
                          {MEMBRESIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Método de Pago</label>
                        <select 
                          value={formData.metodoPago}
                          onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                          className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold cursor-pointer"
                        >
                          <option value="efectivo">Efectivo / Deb</option>
                          <option value="tarjeta">Tarjeta (+5%)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Monto Final Proyectado</p>
                        <h4 className="text-4xl font-black text-blue-500">
                          ${FitnessBusinessLogic.calcularImporte(
                            parseInt(formData.edad) || 0, 
                            formData.membresia, 
                            formData.metodoPago
                          ).toFixed(0)}
                        </h4>
                      </div>
                      <button 
                        type="submit"
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-3xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95 text-sm uppercase tracking-widest"
                      >
                        Validar y Registrar
                      </button>
                    </div>
                  </form>
                </AnimatedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-0 right-0 p-8 text-zinc-700 pointer-events-none z-0 hidden lg:block">
        <div className="flex items-center gap-3">
          <Code2 className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">Hybrid Architecture: C-Logic x React-Core</span>
        </div>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);