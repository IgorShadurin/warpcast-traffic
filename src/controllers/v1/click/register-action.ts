import { Request, Response, NextFunction } from 'express'
import { setExpectedClick } from '../../../utils/memcached/clicks'
import { IRegisterResponse } from './interface/IRegisterResponse'
import { IRegisterRequest } from './interface/IRegisterRequest'
import { getSignedClickInfo, validateFrameId } from '../../../utils/click'

/**
 * Registers potential clicks from Frame 1 to Frame 2
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export default async (
  req: Request<IRegisterRequest>,
  res: Response<IRegisterResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const { toFrameId, clickData, signature } = req.body

    await validateFrameId(toFrameId)
    const { frameId, fid } = await getSignedClickInfo(clickData, signature)
    await setExpectedClick(frameId, BigInt(toFrameId), fid)

    res.json({ status: 'ok' })
  } catch (e) {
    next(e)
  }
}
