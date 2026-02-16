import { Router } from "express";
import { UserGetResponse } from "../../../../proto/generated/allmsgs";

const router = Router()

router.get("/", (req, res) => {
    const data = {
        userRegistration: {

        },
        userGameData: {

        }
    }
})

export default router;