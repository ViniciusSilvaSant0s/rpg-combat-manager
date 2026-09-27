import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react'

type PixelCornerFrameProps<Element extends ElementType> = {
  as: Element
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<Element>, 'as' | 'children' | 'className'>

function PixelCornerFrame<Element extends ElementType>({
  as,
  children,
  className,
  ...props
}: PixelCornerFrameProps<Element>) {
  return createElement(
    as,
    { ...props, className: `pixel-corner-frame ${className ?? ''}` },
    children,
    <span aria-hidden="true" className="pixel-corner-frame__corner pixel-corner-frame__corner--top-left" />,
    <span aria-hidden="true" className="pixel-corner-frame__corner pixel-corner-frame__corner--top-right" />,
    <span aria-hidden="true" className="pixel-corner-frame__corner pixel-corner-frame__corner--bottom-left" />,
    <span aria-hidden="true" className="pixel-corner-frame__corner pixel-corner-frame__corner--bottom-right" />,
  )
}

export default PixelCornerFrame
