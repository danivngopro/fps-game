import type { InputState } from "../types";
import { useGameStore } from "../store";

export class InputManager {
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    crouch: false,
    aim: false,
    reload: false,
    shoot: false,
    pointerLocked: false,
  };

  private readonly handleKeyDownBound = (e: KeyboardEvent) =>
    this.handleKeyDown(e);
  private readonly handleKeyUpBound = (e: KeyboardEvent) =>
    this.handleKeyUp(e);
  private readonly handleMouseDownBound = (e: MouseEvent) =>
    this.handleMouseDown(e);
  private readonly handleMouseUpBound = (e: MouseEvent) =>
    this.handleMouseUp(e);
  private readonly handlePointerLockBound = () => this.handlePointerLock();
  private readonly handleContextMenuBound = (e: MouseEvent) =>
    e.preventDefault();

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    document.addEventListener("keydown", this.handleKeyDownBound);
    document.addEventListener("keyup", this.handleKeyUpBound);
    document.addEventListener("mousedown", this.handleMouseDownBound);
    document.addEventListener("mouseup", this.handleMouseUpBound);
    document.addEventListener("pointerlockchange", this.handlePointerLockBound);
    document.addEventListener("contextmenu", this.handleContextMenuBound);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key === "f3" && !e.repeat) {
      e.preventDefault();
      useGameStore.getState().toggleDebug();
    }
    if (key === "f4" && !e.repeat) {
      e.preventDefault();
      useGameStore.getState().resetMatch();
    }
    if (key === "v" && !e.repeat) {
      useGameStore.getState().toggleCameraMode();
    }
    if (key === "w") this.state.forward = true;
    if (key === "s") this.state.backward = true;
    if (key === "a") this.state.left = true;
    if (key === "d") this.state.right = true;
    if (key === "shift") {
      this.state.crouch = true;
      e.preventDefault();
    }
    if (key === "r") this.state.reload = true;
    if (key === " ") {
      this.state.jump = true;
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key === "w") this.state.forward = false;
    if (key === "s") this.state.backward = false;
    if (key === "a") this.state.left = false;
    if (key === "d") this.state.right = false;
    if (key === "shift") this.state.crouch = false;
    if (key === "r") this.state.reload = false;
    if (key === " ") this.state.jump = false;
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 0) this.state.shoot = true; // left click
    if (e.button === 2) this.state.aim = true;
  }

  private handleMouseUp(e: MouseEvent) {
    if (e.button === 0) this.state.shoot = false;
    if (e.button === 2) this.state.aim = false;
  }

  private handlePointerLock() {
    this.state.pointerLocked = document.pointerLockElement === document.body;
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public requestPointerLock() {
    document.body.requestPointerLock?.();
  }

  public releasePointerLock() {
    document.exitPointerLock?.();
  }

  public isPointerLocked(): boolean {
    return this.state.pointerLocked;
  }

  public cleanup() {
    document.removeEventListener("keydown", this.handleKeyDownBound);
    document.removeEventListener("keyup", this.handleKeyUpBound);
    document.removeEventListener("mousedown", this.handleMouseDownBound);
    document.removeEventListener("mouseup", this.handleMouseUpBound);
    document.removeEventListener(
      "pointerlockchange",
      this.handlePointerLockBound,
    );
    document.removeEventListener("contextmenu", this.handleContextMenuBound);
  }
}
