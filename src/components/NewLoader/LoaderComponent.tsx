import './style.scss'
import Loader from './Loader'
import { type IconTheme } from './IconsCommonTypes'

export default function LoaderComponent(
  theme: IconTheme | undefined = undefined,
) {
  const loaderStyles = theme
    ? {
        animation: 'spin 1s linear infinite',
        svg: {
          path: {
            fill: theme?.color ? theme?.color : '',
          },
        },
        minWidth: theme?.width,
        minHeight: theme?.height,
        Loader: {
          fill: theme?.color ? theme?.color : '',
        },
        fill: theme?.color ? theme?.color : '',
      }
    : {}

  const loaderClasses = [
    theme && Object.keys(theme).length > 0 ? '' : 'loader',
  ].join(' ')

  return (
    <div style={loaderStyles} className={loaderClasses}>
      {theme ? (
        <Loader
          color={theme?.color}
          width={theme?.width}
          height={theme?.height}
        />
      ) : (
        <Loader />
      )}
    </div>
  )
}
