import express from 'express'
import TaskService from '../services/task.service'
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/readCsv", (req, res) => {
  res.send(TaskService.readCsv())
});

// get user By userId
router.post("/getUserByUserId", (req, res) => {
  TaskService.getUserByUserId(req.body.userId)
    .then(user => {
      res.status(200).json(user);
    })
    .catch(err => res.status(400).json(Response.somethingWentWrong()));
});

router.get("/updateProfile", (req, res) => {
  TaskService.updateProfileDetails()
    .then(user => {
      res.status(200).json(user);
    })
    .catch(err => res.status(400).json(Response.somethingWentWrong()));
});

router.post("/getPolicyById", (req, res) => {
  TaskService.getAggregatedPolicy(req.body.userId)
    .then(user => {
      res.status(200).json(user);
    })
    .catch(err => res.status(400).json(Response.somethingWentWrong()));
});

router.put("/getmsg", (req, res) => {
  TaskService.getMsg(req.body)
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => res.status(400).json(Response.somethingWentWrong()));
});

module.exports = router;
