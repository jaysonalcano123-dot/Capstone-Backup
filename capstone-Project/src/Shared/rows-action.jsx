import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Row-level "⋯" actions menu, shared by every account management table
 * (Teacher, Student, Section).
 *
 * Rendered via a portal straight to document.body, positioned with
 * fixed pixel coordinates computed from the trigger button's own
 * position. This is deliberate: earlier versions rendered the dropdown
 * as a normal absolutely-positioned child, which meant any scrollable
 * ancestor (the page body, a card, a table wrapper) with anything other
 * than `overflow: visible` would silently clip it — the menu looked
 * "cut off" at that container's edge regardless of how much actual
 * screen space was available below it. A portal sidesteps that
 * entirely: the menu lives outside the DOM hierarchy that could clip
 * it, so it always has the full viewport to work with.
 *
 * Usage:
 *   <RowActionsMenu
 *       actions={[
 *           { key: 'copy', label: 'Copy ID', icon: '📋', onClick: () => ... },
 *           { key: 'edit', label: 'View / Edit', icon: '✎', onClick: () => ... },
 *           { key: 'reset', label: 'Reset Password', icon: '↻', onClick: () => ... },
 *           { key: 'delete', label: 'Delete', icon: '🗑', danger: true, onClick: () => ... },
 *       ]}
 *   />
 */
function RowActionsMenu({ actions }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            const clickedTrigger = menuRef.current && menuRef.current.contains(event.target);
            const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
            if (!clickedTrigger && !clickedDropdown) {
                setIsOpen(false);
            }
        }
        function handleWindowChange() {
            // Closing on scroll/resize is simpler and more reliable than
            // continuously recalculating position while open — dropdown
            // menus across most apps behave this way already.
            setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, []);

    function toggleOpen() {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const estimatedMenuWidth = 200;
            const estimatedMenuHeight = actions.length * 40 + 16;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

            setMenuStyle({
                position: 'fixed',
                top: openUpward ? undefined : rect.bottom + 6,
                bottom: openUpward ? window.innerHeight - rect.top + 6 : undefined,
                left: Math.max(8, Math.min(rect.right - estimatedMenuWidth, window.innerWidth - estimatedMenuWidth - 8)),
                minWidth: estimatedMenuWidth,
            });
        }
        setIsOpen((open) => !open);
    }

    function run(action) {
        setIsOpen(false);
        action.onClick();
    }

    return (
        <div className="row-actions-menu" ref={menuRef}>
            <button
                ref={triggerRef}
                type="button"
                className="row-actions-trigger"
                onClick={toggleOpen}
                aria-label="Row actions"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                ⋯
            </button>
            {isOpen && menuStyle && createPortal(
                <div ref={dropdownRef} className="dropdown-menu row-actions-dropdown show" style={menuStyle}>
                    {actions.map((action) => (
                        <button
                            key={action.key}
                            type="button"
                            className={`dropdown-item ${action.danger ? 'text-red' : ''}`}
                            onClick={() => run(action)}
                        >
                            <span className="dropdown-item-icon">{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

export default RowActionsMenu;