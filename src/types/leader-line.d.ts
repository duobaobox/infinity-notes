// Leader Line 类型定义
declare module "leader-line" {
  interface LeaderLineOptions {
    color?: string;
    size?: number;
    path?: "straight" | "arc" | "fluid" | "magnet" | "grid";
    startSocket?: "top" | "right" | "bottom" | "left" | "auto";
    endSocket?: "top" | "right" | "bottom" | "left" | "auto";
    startSocketGravity?: number | number[];
    endSocketGravity?: number | number[];
    startPlug?:
      | "disc"
      | "square"
      | "arrow1"
      | "arrow2"
      | "arrow3"
      | "hand"
      | "crosshair"
      | "behind";
    endPlug?:
      | "disc"
      | "square"
      | "arrow1"
      | "arrow2"
      | "arrow3"
      | "hand"
      | "crosshair"
      | "behind";
    startPlugColor?: string;
    endPlugColor?: string;
    startPlugSize?: number;
    endPlugSize?: number;
    outline?: boolean;
    outlineColor?: string;
    outlineSize?: number;
    startLabel?: string | HTMLElement;
    middleLabel?: string | HTMLElement;
    endLabel?: string | HTMLElement;
    dash?: boolean | { len?: number; gap?: number; animation?: boolean };
    gradient?: boolean | { startColor?: string; endColor?: string };
    dropShadow?:
      | boolean
      | {
          dx?: number;
          dy?: number;
          blur?: number;
          color?: string;
          opacity?: number;
        };
    animate?: boolean | { duration?: number; timing?: string };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface LeaderLinePosition {
    x: number;
    y: number;
  }

  interface LeaderLineConstructor {
    new (
      start: HTMLElement,
      end: HTMLElement,
      options?: LeaderLineOptions
    ): LeaderLineInstance;
    positionByWindowResize: boolean;
    setOptions(options: LeaderLineOptions): void;
  }

  interface LeaderLineInstance {
    // 属性
    start: HTMLElement;
    end: HTMLElement;
    color: string;
    size: number;
    path: string;
    startSocket: string;
    endSocket: string;
    startSocketGravity: number | number[];
    endSocketGravity: number | number[];
    startPlug: string;
    endPlug: string;
    startPlugColor: string;
    endPlugColor: string;
    startPlugSize: number;
    endPlugSize: number;
    outline: boolean;
    outlineColor: string;
    outlineSize: number;
    startLabel: string | HTMLElement;
    middleLabel: string | HTMLElement;
    endLabel: string | HTMLElement;
    dash: boolean | object;
    gradient: boolean | object;
    dropShadow: boolean | object;
    animate: boolean | object;

    // 方法
    position(): void;
    remove(): void;
    show(showEffectName?: string, animOptions?: object): void;
    hide(hideEffectName?: string, animOptions?: object): void;
    setOptions(options: LeaderLineOptions): void;
  }

  const LeaderLine: LeaderLineConstructor;
  export = LeaderLine;
}
