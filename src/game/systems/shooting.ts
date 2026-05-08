import { Camera, Matrix3, Raycaster, Vector3 } from "three";
import type { RaycastHit, ShootableObject, WeaponConfig } from "../types";

const fallbackNormal = new Vector3(0, 1, 0);

export class ShootingSystem {
  private readonly raycaster = new Raycaster();
  private lastShotTime = 0;

  public canShoot(weapon: WeaponConfig): boolean {
    const now = performance.now();
    return now - this.lastShotTime >= weapon.fireRate;
  }

  public shoot(
    camera: Camera,
    weapon: WeaponConfig,
    shootables: ShootableObject[],
    spread: number,
  ): RaycastHit | null {
    if (!this.canShoot(weapon)) return null;

    this.lastShotTime = performance.now();

    const origin = new Vector3();
    const direction = new Vector3();
    const right = new Vector3();
    const up = new Vector3();

    camera.getWorldPosition(origin);
    camera.getWorldDirection(direction);
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);

    if (spread > 0) {
      direction.addScaledVector(right, (Math.random() - 0.5) * spread);
      direction.addScaledVector(up, (Math.random() - 0.5) * spread);
      direction.normalize();
    }

    this.raycaster.far = weapon.range;
    this.raycaster.set(origin, direction);

    const objectToShootable = new Map(
      shootables.map((shootable) => [shootable.object, shootable]),
    );
    const intersects = this.raycaster.intersectObjects(
      shootables.map((shootable) => shootable.object),
      false,
    );

    for (const intersect of intersects) {
      const shootable = objectToShootable.get(intersect.object);
      if (!shootable) continue;

      const localNormal = intersect.face?.normal ?? fallbackNormal;
      const normal = localNormal
        .clone()
        .applyMatrix3(new Matrix3().getNormalMatrix(intersect.object.matrixWorld))
        .normalize();

      return {
        point: intersect.point.toArray() as [number, number, number],
        normal: normal.toArray() as [number, number, number],
        distance: intersect.distance,
        objectType: shootable.objectType,
        targetId: shootable.targetId,
        botId: shootable.botId,
        materialType: shootable.surfaceType,
      };
    }

    return null;
  }

  public reset() {
    this.lastShotTime = 0;
  }
}
