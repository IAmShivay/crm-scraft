// src/lib/store/slices/sidebarSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  isCollapsed: boolean;
  activeWorkspaceId: string | null;
  workspaceChangeCounter: number;
}

const initialState: SidebarState = {
  isCollapsed: false,
  activeWorkspaceId: null,
  workspaceChangeCounter: 0,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleCollapse(state) {
      state.isCollapsed = !state.isCollapsed;
    },
    setCollapse(state, action: PayloadAction<boolean>) {
      state.isCollapsed = action.payload;
    },
    setActiveWorkspaceId(state, action: PayloadAction<string | null>) {
      state.activeWorkspaceId = action.payload;
      // Increment the counter whenever the workspace changes
      state.workspaceChangeCounter += 1;
    },
    incrementWorkspaceChangeCounter(state) {
      state.workspaceChangeCounter += 1;
    },
  },
});

export const {
  toggleCollapse,
  setCollapse,
  setActiveWorkspaceId,
  incrementWorkspaceChangeCounter,
} = sidebarSlice.actions;
export default sidebarSlice.reducer;
