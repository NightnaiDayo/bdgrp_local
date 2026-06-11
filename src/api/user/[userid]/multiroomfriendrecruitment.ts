import { Router } from "express";

const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    res.send('')
})

export default router;