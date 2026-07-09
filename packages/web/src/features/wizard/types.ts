/**
 * Shared wizard model.
 *
 * A wizard is a list of STAGES (what the database persists — `setup_current_step`,
 * `_workflow.currentStep`). Each stage owns one or more SUB-STEPS, which are the screens the
 * operator actually sees, one question at a time.
 *
 * Sub-steps are deliberately NOT flattened into stages: both wizards persist their position as an
 * integer stage index, so renumbering would strand every in-flight operator and tour draft.
 */

/** A required field that is missing or invalid on the current screen. */
export interface FieldIssue {
  /** DOM id of the offending control, so we can focus it. Prefix with `wz-`. */
  field: string
  /** Shown under the field, and in the screen's error summary. */
  message: string
}

export interface SubStepDef<TData> {
  id: string
  /** Shown as the screen's heading. */
  title: string
  /** One line under the heading. */
  description?: string
  /**
   * Returns the issues blocking completion. An empty array means the screen is complete.
   * Continue is never blocked — issues are surfaced, and the stage is marked "needs attention".
   */
  validate?: (data: TData) => FieldIssue[]
  /** Optional screens never count as "needs attention". */
  optional?: boolean
}

/** The id used for a control so `focusField` can find it. */
export const fieldId = (name: string) => `wz-${name}`
