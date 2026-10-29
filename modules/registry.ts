/**
 * App sections shown on the Daybook home hub.
 * Add a new module here when introducing another feature area.
 */
export type AppModule = {
  id: string;
  href: string;
  titleKey: string;
  subtitleKey: string;
  mark: "salah" | "timetable";
  accent: string;
  enabled: boolean;
};

export const APP_MODULES: AppModule[] = [
  {
    id: "salah",
    href: "/salah",
    titleKey: "hub.modules.salah.title",
    subtitleKey: "hub.modules.salah.subtitle",
    mark: "salah",
    accent: "#1F7A66",
    enabled: true,
  },
  {
    id: "timetable",
    href: "/timetable",
    titleKey: "hub.modules.timetable.title",
    subtitleKey: "hub.modules.timetable.subtitle",
    mark: "timetable",
    accent: "#3D5A80",
    enabled: true,
  },
];
