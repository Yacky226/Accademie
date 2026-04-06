import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/model/auth.slice";

const authRootReducer = combineReducers({
  auth: authReducer,
});

export type AuthStoreState = ReturnType<typeof authRootReducer>;

export function createAuthStore(preloadedState?: Partial<AuthStoreState>) {
  return configureStore({
    reducer: authRootReducer,
    preloadedState,
  });
}

export type AuthStore = ReturnType<typeof createAuthStore>;
export type AuthDispatch = AuthStore["dispatch"];
