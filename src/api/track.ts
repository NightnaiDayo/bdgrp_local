import { Router } from "express";

const router = Router({ mergeParams: true });

router.post('/', (req, res) => {
    res.send('')
})

export default router;