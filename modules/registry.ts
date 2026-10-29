/**
 * App sections shown on the Daybook home hub.
 * Add a new module here when introducing another feature area.
 */
export type AppModule = {
  id: string;
  href: string;
  titleKey: string;
  subtitleKey: string;
  mark: "salah" | "studies";
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
    id: "studies",
    href: "/studies",
    titleKey: "hub.modules.studies.title",
    subtitleKey: "hub.modules.studies.subtitle",
    mark: "studies",
    accent: "#3D5A80",
    enabled: true,
  },
];

/** Sub-sections inside Studies. */
export type StudiesModule = {
  id: string;
  href: string;
  titleKey: string;
  subtitleKey: string;
  mark: "timetable" | "deadlines";
  accent: string;
};

export const STUDIES_MODULES: StudiesModule[] = [
  {
    id: "timetable",
    href: "/studies/timetable",
    titleKey: "studies.modules.timetable.title",
    subtitleKey: "studies.modules.timetable.subtitle",
    mark: "timetable",
    accent: "#1F7A66",
  },
  {
    id: "deadlines",
    href: "/studies/deadlines",
    titleKey: "studies.modules.deadlines.title",
    subtitleKey: "studies.modules.deadlines.subtitle",
    mark: "deadlines",
    accent: "#3D5A80",
  },
];
