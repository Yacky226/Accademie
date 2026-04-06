import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AuthDispatch, AuthStoreState } from "./auth-store";

export const useAuthStoreDispatch = useDispatch.withTypes<AuthDispatch>();
export const useAuthStoreSelector: TypedUseSelectorHook<AuthStoreState> = useSelector;
