import { userErrorMessages } from '../controller/user'
import { workErrorMessage } from '../controller/work'

export type GlobalErrorTypes = keyof (typeof userErrorMessages & typeof workErrorMessage)