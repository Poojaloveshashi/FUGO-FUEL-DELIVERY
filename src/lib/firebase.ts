// Safe local mock layer for test trail - zero network dependencies or quota limits
export const db = {} as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: (_cb: any) => () => {},
  signOut: async () => {},
} as any;

export default { db, auth };
