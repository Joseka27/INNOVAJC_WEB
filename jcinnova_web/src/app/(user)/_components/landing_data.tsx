export const categories = [
  "Todos",
  "Finanzas",
  "Operación",
  "Comercial",
  "RRHH",
  "Control",
] as const;

export type Category = (typeof categories)[number];
export type ServiceCategory = Exclude<Category, "Todos">;

export type ServiceItem = {
  image: string;
  title: string;
  text: string;
  category: ServiceCategory;
};

export const servicesItems: ServiceItem[] = [
  {
    image: "prueba",
    title: "prueba",
    text: "hola",
    category: "RRHH",
  },
];

export const seceStats = [
  { value: "200+", label: "Informes" },
  { value: "Excel/PDF", label: "Exportables" },
  { value: "BCCR", label: "Tipo de cambio" },
];

export const problemItems = [
  "Duplicación de datos y errores por capturas manuales",
  "Inventario desactualizado y compras fuera de control",
  "Cierres contables lentos y reportes que salen tarde",
  "Difícil seguimiento de ventas, cobros y bancos",
  "Poca visibilidad para gerencia y decisiones a ciegas",
];

export const solutionItems = [
  "Información centralizada para contabilidad, inventario y gestión",
  "Procesos más ordenados y trazabilidad por usuario",
  "Reportes claros para tomar decisiones rápidas",
  "Evitar perdida de datos entre traspasos de aplicaciones",
  "Flujo de trabajo consistente para todo el equipo",
];

export const outcomes = [
  {
    icon: "/images/mainpage/LessWork.png",
    label: "Menos retrabajo",
  },
  { icon: "/images/mainpage/Visibility.png", label: "Más visibilidad" },
  { icon: "/images/mainpage/Agility.png", label: "Procesos ágiles" },
  {
    icon: "/images/mainpage/OperationalControl.png",
    label: "Control operativo",
  },
];

export const seceSteps = [
  {
    icon: "/images/mainpage/Reports.png",
    iconHover: "/images/mainpage/WReports.png",
    title: "Reportería para gestión",
    text: "Más de 200 informes orientados a control y toma de decisiones.",
  },
  {
    icon: "/images/mainpage/FileTypes.png",
    iconHover: "/images/mainpage/WFileTypes.png",
    title: "Exportación inmediata",
    text: "Exporta documentos en distintos formatos como a Excel, Word, PDF, HTML para compartir y analizar.",
  },
  {
    icon: "/images/mainpage/Change.png",
    iconHover: "/images/mainpage/WChange.png",
    title: "Tipo de cambio BCCR",
    text: "Información actualizad Integración con Banco Central.",
  },
  {
    icon: "/images/mainpage/Goverment.png",
    iconHover: "/images/mainpage/WGoverment.png",
    title: "Procesos tributarios",
    text: "Conexión con SIC Web y generación de informes para cumplimiento.",
  },
  {
    icon: "/images/mainpage/Graphs.png",
    iconHover: "/images/mainpage/WGraphs.png",
    title: "Consultas y visualización",
    text: "Resultados con apoyo gráfico para interpretar rápido lo importante.",
  },
  {
    icon: "/images/mainpage/Productivity.png",
    iconHover: "/images/mainpage/WProductivity.png",
    title: "Productividad real",
    text: "Atajos y teclas especiales para acelerar tareas del día a día.",
  },
];
