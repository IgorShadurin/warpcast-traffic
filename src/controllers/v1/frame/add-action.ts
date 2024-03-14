import { Request, Response, NextFunction } from 'express'
import { IAddResponse } from './interface/IAddResponse'
import { IAddRequest } from './interface/IAddRequest'
import { processAuthData } from '../../../utils/auth'
import { getConfigData } from '../../../config'
import { insertFrame } from '../../../db/FrameModel'

/**
 * Validate input
 * @param title Title
 * @param description Description
 * @param url URL
 */
function validateInput(title: string, description: string, url: string): void {
  if (!title) {
    throw new Error('Invalid "title"')
  }

  if (!description) {
    throw new Error('Invalid "description"')
  }

  if (!url) {
    throw new Error('Invalid "url"')
  }
}

/**
 * Validate frame URL by checking the frame owner tag
 * @param url URL
 * @param fid Frame owner ID
 */
async function validateFrameUrl(url: string, fid: number): Promise<void> {
  const expectedTag = `<meta property="frame:owner" content="${fid}"/>`
  const pageText = await (await fetch(url)).text()

  if (!pageText.includes(expectedTag)) {
    throw new Error('Cannot find the frame owner tag on the page. Please add the tag to the page.')
  }
}

/**
 * Add frame action
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export default async (req: Request<IAddRequest>, res: Response<IAddResponse>, next: NextFunction): Promise<void> => {
  try {
    const { title, description, url, message, signature, nonce } = req.body
    const { appDomain } = getConfigData()
    const { fid } = await processAuthData(message, signature as `0x${string}`, appDomain, nonce)
    validateInput(title, description, url)
    await validateFrameUrl(url, fid)

    try {
      await insertFrame({
        frame_owner_id: BigInt(fid),
        title,
        description,
        url,
        data: '',
        verify_tag: '',
        promo_data: '',
        promo_approved: false,
      })
    } catch (e) {
      throw new Error('Frame cannot be added. It is already exists or some other error occurred.')
    }
    res.json({ status: 'ok' })
  } catch (e) {
    next(e)
  }
}
