import { type Team, type Member } from "../types";
import { api } from "../api";
import { getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CACHE } from "./data.cache";

type Session = {
  member: Member["id"] | null;
  team: Team["id"] | null;
};

export const atom = atomWithStorage<Session>(CACHE, {
  member: null,
  team: null,
});

export const login = async (credentials: {
  email: string;
  password: string;
}): Promise<boolean> => {
  console.log(credentials);
  const response = await api.POST["api/auth"](credentials);
  const store = getDefaultStore();

  if (!response) return false;

  store.set(atom, {
    member: response.user,
    team: null,
  });

  return true;
};

export const logout = async () => {
  const store = getDefaultStore();

  store.set(atom, {
    member: null,
    team: null,
  });

  await api.POST["api/logout"]();
  window.location.reload();
};
