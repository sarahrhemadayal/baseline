// "use client";

import Image from 'next/image';
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec3 } from "ogl";

export function Logo(props: React.ComponentProps<'div'>) {
  return (
    <div {...props}>
      <Image
        src="/logo.svg"
        alt="Logo"
        width={24}
        height={24}
        priority
      />
    </div>
  );
}