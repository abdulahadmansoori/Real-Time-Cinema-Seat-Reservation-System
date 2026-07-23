"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS, type SeatsUpdatedPayload } from "@cinema/shared";
import { getApiUrl } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(getApiUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function onSeatsUpdated(
  handler: (payload: SeatsUpdatedPayload) => void,
) {
  const s = getSocket();
  if (!s) return () => undefined;
  s.on(SOCKET_EVENTS.SEATS_UPDATED, handler);
  return () => {
    s.off(SOCKET_EVENTS.SEATS_UPDATED, handler);
  };
}

export function useSocketConnected() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const sync = () => setConnected(s.connected);
    sync();

    s.on("connect", sync);
    s.on("disconnect", sync);
    s.on("reconnect", sync);
    s.on("connect_error", sync);

    return () => {
      s.off("connect", sync);
      s.off("disconnect", sync);
      s.off("reconnect", sync);
      s.off("connect_error", sync);
    };
  }, []);

  return connected;
}
