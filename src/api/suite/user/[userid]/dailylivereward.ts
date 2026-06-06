import { Router } from "express";
import { SuiteUserDailyLiveClearResponse } from "@proto";
import { encrypt } from "@util/encrypt";

const router = Router({ mergeParams: true })

router.put('/', async(req, res) => {
    const data = {
        updateResources: {
            updatedBandDeckRankList: {},
            userDailyLive: {
                lastClearedAt: 1770992661000,
                liveStartedAt: 1770992661000,
                getDailyLiveRewardId: 6
            },
            userDailyLiveTotalRewardHistory: {
                userId: req.params.userid,
                dailyLiveId: 8,
                status: "STARTED",
                dailyLiveCount: 1,
            }
        },
        response: {
            userDailyLive: {
                lastClearedAt: 1770992661000,
                liveStartedAt: 1770992661000,
                getDailyLiveRewardId: 6,
                dailyPresents: [
                    {
                        resourceId: 43,
                        resourceType: "practice_ticket",
                        quantity: 1,
                        lbBonus: 1,
                    }
                ]
            }
        }
    }

    const message = SuiteUserDailyLiveClearResponse.fromJSON(data)
    const buffer = Buffer.from(SuiteUserDailyLiveClearResponse.encode(message).finish())
    const encBuffer = encrypt(buffer)

    res.send(encBuffer)

})

export default router;