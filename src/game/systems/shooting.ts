import { Camera, Raycaster, Vector3, type Object3D } from "three";
import type { RaycastHit, WeaponConfig } from "../types";

export class ShootingSystem {
  private raycaster: Raycaster;
  private lastShotTime: number = 0;
  private hitMarkerTime: number = 0;
  private showHitMarker: boolean = false;

  constructor() {
    this.raycaster = new Raycaster();
  }

  public canShoot(weapon: WeaponConfig): boolean {
    const now = Date.now();
    return now - this.lastShotTime >= weapon.fireRate;
  }

  public shoot(
    camera: Camera,
    weapon: WeaponConfig,
    targets: Array<{ id: string; mesh: Object3D }>,
    spread: number,
  ): RaycastHit | null {
    if (!this.canShoot(weapon)) return null;

    this.lastShotTime = Date.now();

    // Create ray from camera center
    this.raycaster.far = weapon.range;
    const origin = new Vector3();
    const direction = new Vector3();
    const right = new Vector3();
    const up = new Vector3();

    camera.getWorldPosition(origin);
    camera.getWorldDirection(direction);
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);

    if (spread > 0) {
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;
      direction.addScaledVector(right, spreadX);
      direction.addScaledVector(up, spreadY);
      direction.normalize();
    }

    this.raycaster.set(origin, direction);

    // Check for hits
    const intersects = this.raycaster.intersectObjects(
      targets.map((t) => t.mesh),
      false,
    );

    if (intersects.length > 0) {
      const hit = intersects[0];
      this.showHitMarker = true;
      this.hitMarkerTime = Date.now();
      return {
        point: hit.point.toArray() as [number, number, number],
        distance: hit.distance,
        targetId:
          typeof hit.object.userData.targetId === "string"
            ? hit.object.userData.targetId
            : undefined,
      };
    }

    return null;
  }

  public isHitMarkerVisible(): boolean {
    if (!this.showHitMarker) return false;
    if (Date.now() - this.hitMarkerTime > 100) {
      this.showHitMarker = false;
      return false;
    }
    return true;
  }

  public reset() {
    this.lastShotTime = 0;
    this.showHitMarker = false;
  }
}
