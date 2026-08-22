/** Navigation + section registry. Single source for the floating nav,
 *  the scroll spy, and the section eyebrow numbers. */

export interface SectionDef {
  /** DOM id, also the nav anchor. */
  id: string
  /** Nav label. */
  label: string
  /** Editorial index shown in the section header. */
  index: string
}

export const sections: SectionDef[] = [
  { id: "index", label: "Index", index: "00" },
  { id: "approach", label: "Approach", index: "01" },
  { id: "work", label: "Work", index: "02" },
  { id: "track-record", label: "Track Record", index: "03" },
  { id: "capabilities", label: "Capabilities", index: "04" },
  { id: "contact", label: "Contact", index: "05" },
]

/** Nav omits the hero — you get there with the wordmark. */
export const navSections = sections.filter((s) => s.id !== "index")
