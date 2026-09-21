import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ROW SELECTION
 * -------------
 * Checkbox multi-select for the data tables (Students, Teachers, Sections),
 * powering batch actions like Batch Archive / Batch Delete.
 *
 *   const selection = useRowSelection(filteredStudents, students, (s) => s.id);
 *
 *   selection.selectedCount        // how many rows are ticked
 *   selection.selectedItems        // the actual row objects, in table order
 *   selection.isSelected(row)      // for each row checkbox
 *   selection.toggleRow(row, e)    // click handler (supports shift-click ranges)
 *   selection.toggleAll()          // header checkbox — all *visible* rows
 *   selection.allVisibleSelected   // header checkbox `checked`
 *   selection.someVisibleSelected  // header checkbox `indeterminate`
 *   selection.clear()              // "Clear selection"
 *
 * Two lists are accepted on purpose:
 *   visibleRows — what's rendered right now (after search/filter)
 *   allRows     — the full dataset, so a row that's temporarily filtered out
 *                 stays selected instead of silently dropping out of a batch.
 * Ids that no longer exist at all (deleted rows) are pruned automatically.
 */
const defaultGetId = (row) => row?.id;

export default function useRowSelection(visibleRows = [], allRows = visibleRows, getId = defaultGetId) {
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    // Keep the accessor in a ref so callers can pass an inline arrow without
    // re-running effects on every render.
    const getIdRef = useRef(getId);
    getIdRef.current = getId;

    const key = useCallback((row) => String(getIdRef.current(row)), []);

    const visibleIds = useMemo(() => visibleRows.map(key), [visibleRows, key]);
    const allIdsKey = useMemo(() => allRows.map(key).join('|'), [allRows, key]);

    // Drop ids for rows that no longer exist (e.g. after a delete or reload).
    useEffect(() => {
        const existing = new Set(allIdsKey ? allIdsKey.split('|') : []);
        setSelectedIds((prev) => {
            const kept = [...prev].filter((id) => existing.has(id));
            // Return the same Set when nothing was pruned, so this effect can't
            // loop by handing React a brand new object every run.
            if (kept.length === prev.size) return prev;
            return new Set(kept);
        });
    }, [allIdsKey]);

    const isSelected = useCallback((row) => selectedIds.has(key(row)), [selectedIds, key]);

    // Anchor for shift-click range selection, like a file explorer.
    const lastIndexRef = useRef(null);

    const toggleRow = useCallback((row, event) => {
        const id = key(row);
        const index = visibleIds.indexOf(id);
        const isRange = Boolean(event?.shiftKey) && lastIndexRef.current !== null && index !== -1;

        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isRange) {
                const [start, end] = [lastIndexRef.current, index].sort((a, b) => a - b);
                const turningOn = !next.has(id);
                for (let i = start; i <= end; i++) {
                    if (turningOn) next.add(visibleIds[i]);
                    else next.delete(visibleIds[i]);
                }
            } else if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

        if (index !== -1) lastIndexRef.current = index;
    }, [visibleIds, key]);

    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const someVisibleSelected = !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id));

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const everyVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
            if (everyVisibleSelected) visibleIds.forEach((id) => next.delete(id));
            else visibleIds.forEach((id) => next.add(id));
            return next;
        });
        lastIndexRef.current = null;
    }, [visibleIds]);

    const clear = useCallback(() => {
        setSelectedIds(new Set());
        lastIndexRef.current = null;
    }, []);

    const selectedItems = useMemo(
        () => allRows.filter((row) => selectedIds.has(key(row))),
        [allRows, selectedIds, key],
    );

    return {
        selectedIds,
        selectedItems,
        selectedCount: selectedIds.size,
        visibleCount: visibleIds.length,
        isSelected,
        toggleRow,
        toggleAll,
        clear,
        allVisibleSelected,
        someVisibleSelected,
    };
}

/**
 * Header checkbox that can render the "some but not all" dash state.
 * React has no `indeterminate` prop, so it's set on the DOM node directly.
 */
export function SelectAllCheckbox({ checked, indeterminate, onChange, disabled, title }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
    }, [indeterminate]);

    return (
        <input
            ref={ref}
            type="checkbox"
            className="row-checkbox"
            checked={Boolean(checked)}
            onChange={onChange}
            disabled={disabled}
            title={title || 'Select all rows on this page'}
            aria-label="Select all rows"
        />
    );
}