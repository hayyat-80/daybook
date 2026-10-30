"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SemestersManager } from "@/components/studies/SemestersManager";
import { Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useTimetableStore } from "@/stores/timetableStore";

export function SemesterPicker() {
  const { t } = useTranslation();
  const semesters = useTimetableStore((s) => s.semesters);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const setActiveSemester = useTimetableStore((s) => s.setActiveSemester);
  const [manageOpen, setManageOpen] = useState(false);
  const [startInCreate, setStartInCreate] = useState(false);

  function openManage(create = false) {
    setStartInCreate(create);
    setManageOpen(true);
  }

  function closeManage() {
    setManageOpen(false);
    setStartInCreate(false);
  }

  if (semesters.length === 0) {
    return (
      <>
        <div className="semester-picker rise">
          <div className="semester-picker__empty">
            <div className="min-width-0">
              <div className="type-eyebrow">{t("timetable.semester.label")}</div>
              <div className="type-display-sm">{t("timetable.semester.none")}</div>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--compact"
              onClick={() => openManage(true)}
            >
              {t("timetable.semester.create")}
            </button>
          </div>
        </div>
        <Modal
          open={manageOpen}
          title={t("timetable.semester.manageTitle")}
          onClose={closeManage}
          wide
        >
          <SemestersManager key={startInCreate ? "create" : "list"} startInCreate={startInCreate} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="semester-picker rise">
        <label className="semester-picker__label" htmlFor="studies-semester">
          {t("timetable.semester.label")}
        </label>
        <div className="semester-picker__row">
          <Select
            id="studies-semester"
            value={activeSemesterId ?? ""}
            onChange={(e) => {
              if (e.target.value) void setActiveSemester(e.target.value);
            }}
            aria-label={t("timetable.semester.label")}
          >
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </Select>
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--compact semester-picker__manage"
            onClick={() => openManage(false)}
          >
            <span className="semester-picker__manage-full">{t("timetable.semester.manage")}</span>
            <span className="semester-picker__manage-short">
              {t("timetable.semester.manageShort")}
            </span>
          </button>
        </div>
      </div>
      <Modal
        open={manageOpen}
        title={t("timetable.semester.manageTitle")}
        onClose={closeManage}
        wide
      >
        <SemestersManager key={startInCreate ? "create" : "list"} startInCreate={startInCreate} />
      </Modal>
    </>
  );
}
