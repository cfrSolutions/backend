const router = require("express").Router();

const auth = require("../middleware/auth");

const {
    createSurvey,
} = require("../controllers/surveyController");

router.post(
    "/create",
    auth,
    createSurvey
);

module.exports = router;