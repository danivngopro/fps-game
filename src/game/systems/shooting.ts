import { Camera, Raycaster, Vector2, type Object3D } from "three";
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
  ): RaycastHit | null {
    if (!this.canShoot(weapon)) return null;

    this.lastShotTime = Date.now();

    // Create ray from camera center
    this.raycaster.far = weapon.range;
    this.raycaster.setFromCamera(new Vector2(0, 0), camera);

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
