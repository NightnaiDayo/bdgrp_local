import { Router } from "express";

const router = Router({ mergeParams: true })

router.put('/', (req, res) => {
    res.send('')
})

export default router;