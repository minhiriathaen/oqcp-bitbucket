import { AddOn } from 'atlassian-connect-express';
import Container, { Token } from 'typedi';

export const ADDON_TOKEN = new Token('ADDON');

export function setAddonInContainer(addon: AddOn): void {
  Container.set(ADDON_TOKEN, addon);
}
