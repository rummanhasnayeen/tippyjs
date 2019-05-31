import { version } from '../package.json'
import { isBrowser } from './browser'
import { defaultProps } from './props'
import createTippy from './createTippy'
import bindGlobalEventListeners, {
  currentInput,
} from './bindGlobalEventListeners'
import { arrayFrom } from './ponyfills'
import { isRealElement, getArrayOfElements, isReferenceElement } from './utils'
import { warnWhen, validateTargets, validateProps } from './validation'
import { POPPER_SELECTOR } from './constants'
import {
  Props,
  Instance,
  Targets,
  PopperElement,
  HideAllOptions,
} from './types'

/**
 * Exported module
 */
function tippy(
  targets: Targets,
  optionalProps?: Partial<Props>,
): Instance | Instance[] {
  if (__DEV__) {
    validateTargets(targets)
    validateProps(optionalProps)
  }

  bindGlobalEventListeners()

  const props: Props = { ...defaultProps, ...optionalProps }

  const elements = getArrayOfElements(targets)

  if (__DEV__) {
    const isSingleContentElement = isRealElement(props.content)
    const isMoreThanOneReferenceElement = elements.length > 1
    warnWhen(
      isSingleContentElement && isMoreThanOneReferenceElement,
      '`tippy()` was passed a targets argument that will create more than ' +
        'one tippy instance, but only a single element was supplied as the ' +
        '`content` prop. This means the content will only be appended to the ' +
        'last tippy element of the list. Instead, use a function that ' +
        'returns a cloned version of the element instead, or pass the ' +
        '.innerHTML of the element.',
    )
  }

  const instances = elements.reduce<Instance[]>(
    (acc, reference): Instance[] => {
      const instance = reference && createTippy(reference, props)

      if (instance) {
        acc.push(instance)
      }

      return acc
    },
    [],
  )

  return isRealElement(targets) ? instances[0] : instances
}

tippy.version = version
tippy.defaultProps = defaultProps
tippy.currentInput = currentInput

/**
 * Mutates the defaultProps object by setting the props specified
 */
tippy.setDefaultProps = (partialProps: Partial<Props>): void => {
  Object.keys(partialProps).forEach(
    (key): void => {
      // @ts-ignore
      defaultProps[key] = partialProps[key]
    },
  )
}

/**
 * Hides all visible poppers on the document
 */
tippy.hideAll = ({
  exclude: excludedReferenceOrInstance,
  duration,
}: HideAllOptions = {}): void => {
  arrayFrom(document.querySelectorAll(POPPER_SELECTOR)).forEach(
    (popper: PopperElement): void => {
      const instance = popper._tippy

      if (instance) {
        let isExcluded = false
        if (excludedReferenceOrInstance) {
          isExcluded = isReferenceElement(excludedReferenceOrInstance)
            ? instance.reference === excludedReferenceOrInstance
            : popper === excludedReferenceOrInstance.popper
        }

        if (!isExcluded) {
          instance.hide(duration)
        }
      }
    },
  )
}

if (__DEV__) {
  Object.defineProperty(tippy, 'group', {
    value: (): void => {
      warnWhen(
        true,
        '`tippy.group()` was removed in v5 and replaced with ' +
          '`createSingleton()`. Read more here: ' +
          'https://atomiks.github.io/tippyjs/addons#singleton',
      )
    },
    enumerable: false,
  })

  Object.defineProperty(tippy, 'setDefaults', {
    value: (): void => {
      warnWhen(
        true,
        '`tippy.setDefaults()` was renamed to `tippy.setDefaultProps()` in v5.',
      )
    },
    enumerable: false,
  })

  Object.defineProperty(tippy, 'defaults', {
    get(): void {
      warnWhen(
        true,
        'The `tippy.defaults` property was renamed to `tippy.defaultProps` ' +
          'in v5.',
      )
      return undefined
    },
    enumerable: false,
  })
}

/**
 * Auto-init tooltips for elements with a `data-tippy="..."` attribute
 */
export function autoInit(): void {
  arrayFrom(document.querySelectorAll('[data-tippy]')).forEach(
    (el): void => {
      const content = el.getAttribute('data-tippy')

      if (content) {
        tippy(el, { content })
      }
    },
  )
}

if (isBrowser) {
  setTimeout(autoInit)
}

export default tippy
