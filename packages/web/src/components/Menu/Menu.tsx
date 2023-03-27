import {
  HTMLAttributes,
  ReactNode,
  RefAttributes,
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import {
  Menu as BaseMenu,
  MenuGroup as BaseMenuGroup,
  MenuItem as BaseMenuItem,
  MenuSeparator as BaseMenuSeparator,
  MenuDescription as BaseMenuDescription,
  MenuButton,
  MenuButtonArrow,
  MenuGroupLabel,
  MenuHeading,
  useMenuState,
} from 'ariakit/menu';
import { flushSync } from 'react-dom';
import styled, { css } from 'styled-components';
import {
  ButtonColour,
  buttonColours,
  buttonCommonStyles,
  ButtonProps,
  ButtonStyle,
} from '../Button/Button';
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  useComboboxState,
} from 'ariakit';
import { baseInputStyles } from '../Input/Input';

type MenuContextProps = {
  getWrapper: () => HTMLElement | null;
  getMenu: () => HTMLElement | null;
  getOffsetRight: () => number;
};

const MenuContext = createContext<MenuContextProps | null>(null);

export const MenuDescription = BaseMenuDescription;

export type MenuProps = HTMLAttributes<HTMLDivElement> & {
  label: (isSubmenu: boolean) => ReactNode;
  $buttonColour?: ButtonColour;
  $buttonStyle?: ButtonStyle;
  disabled?: boolean;
  $composite?: boolean;
};

type MenuButtonProps = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement>;

const MenuButtonWrapper = styled.span<ButtonProps>`
  --button-colors-normal: ${(props) => props.colours.normal};
  --button-colors-hover: ${(props) => props.colours.hover};
  --button-colors-focused: ${(props) => props.colours.focused};
  --button-colors-disabled: ${(props) => props.colours.disabled};
  --button-padding: ${(props) => props.padding};
`;

const CustomMenuButton = styled(MenuButton)`
  ${buttonCommonStyles}

  background-color: var(--button-colors-normal);

  &:hover {
    background: var(--button-colors-hover);
  }

  &:active {
    background: var(--button-colors-focused);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--colors-text-disabled);
    background: var(--button-colors-disabled);
  }
`;

export const menuStyles = css`
  border-radius: var(--borders-radius);
  background-color: var(--colors-contentBackground);
  box-shadow: 2px 2px 10px var(--colors-shadow);
  padding: var(--spacing-tiny) var(--spacing-tiny);
  border-radius: var(--borders-radius);
`;

export const menuItemStyles = css`
  font-size: 1rem;

  background: none;
  border: none;
  padding: var(--spacing-tiny) var(--spacing-small);
  border-radius: var(--borders-radius);
  &:hover {
    background: var(--colors-button-transparent-hover);
    cursor: pointer;
  }

  &:active {
    background: var(--colors-button-transparent-active);
  }
`;

const CustomMenu = styled(BaseMenu)`
  z-index: 50;
  display: flex;
  height: min(320px, var(--popover-available-height));
  /* width: ; */
  scroll-snap-align: start;
  scroll-snap-stop: always;
  flex-direction: column;
  overflow-y: auto;
  background-color: inherit;
  padding: 0.5rem;
  outline: 2px solid transparent;
  outline-offset: 2px;

  &[data-leave] {
    z-index: 0;
  }
`;

const MenuWrapper = styled.div`
  & .menu-wrapper {
    ${menuStyles}

    z-index: 50;
    overflow-y: hidden;
    overflow-x: scroll;
    overscroll-behavior: contain;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    scroll-snap-stop: always;
    scrollbar-width: none;
  }
  & .menu-wrapper::-webkit-scrollbar {
    display: none;
  }

  & .menu-item {
    min-width: 200px;
    text-align: start;

    ${menuItemStyles}
  }
`;

const SubmenuHeader = styled.div`
  display: flex;
  min-width: 200px;
  align-items: center;
`;

const SubmenuHeading = styled(MenuHeading)`
  font-size: var(--typography-size-paragraph);
  padding: 0;
  line-height: 1.4;
`;

const BackMenuItem = styled(BaseMenuItem)`
  &.menu-item {
    min-width: unset;
    padding: var(--spacing-tiny);
    margin-right: var(--spacing-tiny);
  }
`;

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ label, children, ...props }, ref) => {
    const parent = useContext(MenuContext);
    const isSubmenu = !!parent;

    const menu = useMenuState({
      placement: isSubmenu ? 'right-start' : 'bottom-start',
      overflowPadding: isSubmenu ? 0 : 8,
      animated: isSubmenu ? 500 : false,
      gutter: isSubmenu ? 0 : 8,
      flip: !isSubmenu,
      getAnchorRect: (anchor) => {
        return (
          parent?.getMenu()?.getBoundingClientRect() ||
          anchor?.getBoundingClientRect() ||
          null
        );
      },
    });

    // By default, submenus don't automatically receive focus when they open.
    // But here we want them to always receive focus.
    if (!menu.autoFocusOnShow) {
      menu.setAutoFocusOnShow(true);
    }

    const menuPopoverRef = menu.popoverRef;
    const menuBaseRef = menu.baseRef;
    const parentOffsetRight = parent?.getOffsetRight;
    const parentWrapper = parent?.getWrapper;
    const menuOpen = menu.open;
    const menuHide = menu.hide;
    const menuStop = menu.stopAnimation;

    const contextValue = useMemo<MenuContextProps>(
      () => ({
        getWrapper: () =>
          parentWrapper ? parentWrapper() : menuPopoverRef.current,
        getMenu: () => menuBaseRef.current,
        getOffsetRight: () =>
          (parentOffsetRight ? parentOffsetRight() : 0) +
          (menuBaseRef.current?.offsetWidth ?? 0),
      }),
      [menuPopoverRef, menuBaseRef, parentOffsetRight, parentWrapper]
    );

    // Hide the submenu when it's not visible on scroll.
    useEffect(() => {
      if (!parent) return;
      const parentWrapper = parent.getWrapper();
      if (!parentWrapper) return;
      let timeout = 0;
      const onScroll = () => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          // In right-to-left layouts, scrollLeft is negative.
          const scrollLeft = Math.abs(parentWrapper.scrollLeft);
          const wrapperOffset = scrollLeft + parentWrapper.clientWidth;
          if (wrapperOffset <= parent.getOffsetRight()) {
            // Since the submenu is not visible anymore at this point, we want
            // to hide it completely right away. That's why we syncrhonously
            // hide it and immediately stops the animation so it's completely
            // unmounted.
            flushSync(menuHide);
            menuStop();
          }
        }, 100);
      };
      parentWrapper.addEventListener('scroll', onScroll);
      return () => parentWrapper.removeEventListener('scroll', onScroll);
    }, [parent, menuHide, menuStop]);

    // We only want to delay hiding the menu, so we immediately stop the
    // animation when it's opening.
    useEffect(() => {
      if (!menuOpen) return;
      menuStop();
    }, [menuOpen, menuStop]);

    const colours = buttonColours[props.$buttonColour ?? ButtonColour.Normal];
    const padding =
      props.$buttonStyle === ButtonStyle.Icon
        ? 'var(--spacing-tiny)'
        : 'var(--spacing-tiny) var(--spacing-base)';

    const renderMenuButton = (menuButtonProps: MenuButtonProps) => (
      <MenuButtonWrapper colours={colours} padding={padding}>
        <CustomMenuButton state={menu} showOnHover={false} {...menuButtonProps}>
          <span className="label">{label(false)}</span>
        </CustomMenuButton>
      </MenuButtonWrapper>
    );

    const wrapperProps = {
      // This is necessary so Chrome scrolls the submenu into view.
      style: { left: 'auto' },
      className: !isSubmenu ? 'menu-wrapper' : '',
    };

    const autoFocus = (element: HTMLElement) => {
      if (!isSubmenu) return true;
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: 'nearest', inline: 'start' });
      return false;
    };

    return (
      <>
        {isSubmenu ? (
          // If it's a submenu, we have to combine the MenuButton and the
          // MenuItem components into a single component, so it works as a
          // submenu button.
          <BaseMenuItem
            ref={ref}
            focusOnHover={false}
            className="menu-item"
            {...props}
          >
            {renderMenuButton}
          </BaseMenuItem>
        ) : (
          // Otherwise, we just render the menu button.
          renderMenuButton({ ref, ...props })
        )}
        <MenuWrapper>
          {menu.mounted && (
            <CustomMenu
              state={menu}
              portal={isSubmenu}
              portalElement={parent?.getWrapper}
              wrapperProps={wrapperProps}
              autoFocusOnShow={autoFocus}
              autoFocusOnHide={autoFocus}
              composite={props.$composite}
            >
              <MenuContext.Provider value={contextValue}>
                {isSubmenu && (
                  <>
                    <SubmenuHeader>
                      <BackMenuItem
                        // as="button"
                        hideOnClick={false}
                        focusOnHover={false}
                        onClick={menu.hide}
                        className="menu-item"
                        aria-label="Back to parent menu"
                      >
                        <MenuButtonArrow placement="left" />
                      </BackMenuItem>
                      <SubmenuHeading>{label(true)}</SubmenuHeading>
                    </SubmenuHeader>
                    <MenuSeparator />
                  </>
                )}
                {children}
              </MenuContext.Provider>
            </CustomMenu>
          )}
        </MenuWrapper>
      </>
    );
  }
);

export type MenuItemProps = HTMLAttributes<HTMLButtonElement> & {
  label: ReactNode;
  disabled?: boolean;
};

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ label, ...props }, ref) => {
    return (
      <BaseMenuItem
        as="button"
        focusOnHover={false}
        className="menu-item"
        ref={ref}
        {...props}
      >
        {label}
      </BaseMenuItem>
    );
  }
);

const CustomMenuSeperator = styled(BaseMenuSeparator)`
  width: 100%;
  background-color: var(--colors-contentBackground-light);
`;

export type MenuSeparatorProps = HTMLAttributes<HTMLHRElement>;

export const MenuSeparator = forwardRef<HTMLHRElement, MenuSeparatorProps>(
  (props, ref) => {
    return <CustomMenuSeperator ref={ref} {...props} />;
  }
);

export type MenuGroupProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ label, ...props }, ref) => {
    return (
      <BaseMenuGroup ref={ref} className="group" {...props}>
        {label && (
          <MenuGroupLabel className="group-label">{label}</MenuGroupLabel>
        )}
        {props.children}
      </BaseMenuGroup>
    );
  }
);

const ComboboxInput = styled(Combobox)`
  ${baseInputStyles}

  &:focus,
  &:focus-visible {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }

  margin-bottom: var(--spacing-tiny);
`;

const CustomComboList = styled(ComboboxList)`
  display: flex;
  flex-direction: column;
`;

interface ComboboxProps {
  list: string[];
  onItemSelect: (item: string) => void;
}

export const MenuComboList = ({ list, onItemSelect }: ComboboxProps) => {
  const combobox = useComboboxState({
    list,
    open: true,
  });
  return (
    <>
      <ComboboxInput
        state={combobox}
        autoSelect
        placeholder="Search..."
        autoFocus={true}
      />
      <CustomComboList state={combobox}>
        {combobox.matches.map((value, i) => (
          <ComboboxItem
            as={MenuItem}
            label={value}
            key={value + i}
            value={value}
            focusOnHover
            setValueOnClick={false}
            onClick={() => {
              onItemSelect(value);
              combobox.setValue('');
            }}
            clickOnSpace={true}
            clickOnEnter={true}
          />
        ))}
      </CustomComboList>
    </>
  );
};
