import {
  Menu as ReachMenu,
  MenuList as ReachMenuList,
  MenuItem as ReachMenuItem,
  MenuItems as ReachMenuItems,
  MenuButton as ReachMenuButton,
} from '@reach/menu-button';
import styled, { css } from 'styled-components';
import { buttonCommonStyles } from '../Button/Button';

export const Menu = ReachMenu;

const menuCss = css`
  background-color: var(--colors-contentBackground);
  box-shadow: 2px 2px 10px var(--colors-shadow);
  padding: var(--spacing-small) var(--spacing-tiny);
  border-radius: var(--borders-radius);
`;

export const MenuList = styled(ReachMenuList)`
  ${menuCss}
`;

export const MenuItems = styled(ReachMenuItems)`
  ${menuCss}
`;

export const menuItemStyles = css`
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

export const MenuItem = styled(ReachMenuItem)`
  ${menuItemStyles}
`;

export const MenuButton = styled(ReachMenuButton)`
  ${buttonCommonStyles}
  background-color: hsla(0deg 0% 0% / 0%);

  &:hover {
    background: var(--colors-button-transparent-hover);
  }

  &:active {
    background: var(--colors-button-transparent-active);
  }
`;
