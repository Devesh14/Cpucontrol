import Promise from 'bluebird'
import csv from 'csvtojson'
import uuidv4 from 'uuid/v4';
import _ from 'lodash'
import cron from 'cron'

import UserInfo from '../models/UserInfo'
import Agent from '../models/Agent'
import PolicyCarrier from '../models/PolicyCarrier'
import PolicyInfo from '../models/PolicyInfo'
import User from '../models/User'
import UserAccDetail from '../models/UserAccDetail'
import MsgDump from '../models/MsgDump'
import Message from '../models/Message'

import idMap from '../utils/id-map';

import Response from '../response'

class TaskService {
    readCsv() {
        csv()
            .fromFile(__dirname + '/data.csv')
            .then((jsonArrayObj) => {
                console.log('reading csv....');
                return UserInfo.insertMany([
                    ...jsonArrayObj
                ]).then((data) => {
                    console.log('Data successfully inserted')
                    return data
                })
            })
    }

    updateProfileDetails() {
        return UserInfo.find({}).lean()
            .then(userData => {
                return Promise.map(userData, (data) => {
                    console.log(data)
                    return User.insertMany([{
                        _id: `${idMap.user}-${uuidv4()}`,
                        firstname: data.firstname,
                        dob: data.dob,
                        gender: data.gender,
                        phone: data.phone,
                        email: data.email,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        zip: data.zip
                    }]).then(() => {
                        return User.find({}).lean()
                            .then(details => {
                                return Promise.map(details, (detail) => {
                                    if (data.firstname === detail.firstname) {
                                        return Agent.insertMany([{
                                            _id: `${idMap.agent}-${uuidv4()}`,
                                            userId: detail._id,
                                            agent_name: data.agent
                                        }]).then(() => {
                                            return PolicyCarrier.insertMany([{
                                                _id: `${idMap.PolicyCarrier}-${uuidv4()}`,
                                                userId: detail._id,
                                                company_name: data.company_name
                                            }])
                                        }).then(() => {
                                            return UserAccDetail.insertMany([{
                                                _id: `${idMap.UserAccDetail}-${uuidv4()}`,
                                                userId: detail._id,
                                                account_name: data.account_name,
                                                account_type: data.account_type
                                            }])
                                        }).then(() => {
                                            return PolicyInfo.insertMany([{
                                                _id: `${idMap.PolicyInfo}-${uuidv4()}`,
                                                userId: detail._id,
                                                policy_mode: data.policy_mode,
                                                policy_number: data.policy_number,
                                                premium_amount: data.premium_amount,
                                                policy_type: data.policy_type,
                                                company_name: data.company_name,
                                                category_name: data.category_name,
                                                policy_start_date: data.policy_start_date,
                                                policy_end_date: data.policy_end_date,
                                                csr: data.csr
                                            }])
                                        })
                                    }
                                })
                            })
                    })
                }).then(() => {
                    return Response.successResponse('Data updated successfully')
                })
            })
    }

    getUserByUserId(userId) {
        return User.aggregate([{
                $match: {
                    _id: userId
                }
            },
            {
                "$lookup": {
                    "from": "agents",
                    "localField": "_id",
                    "foreignField": "userId",
                    "as": "agentDetail"
                }
            },
            {
                "$unwind": "$agentDetail"
            },
            {
                "$lookup": {
                    "from": "policycarriers",
                    "localField": "_id",
                    "foreignField": "userId",
                    "as": "policycarrier"
                }
            },
            {
                "$unwind": "$policycarrier"
            },
            {
                "$lookup": {
                    "from": "policyinfos",
                    "localField": "_id",
                    "foreignField": "userId",
                    "as": "policyinfo"
                }
            },
            {
                "$unwind": "$policyinfo"
            },
            {
                "$lookup": {
                    "from": "useraccdetails",
                    "localField": "_id",
                    "foreignField": "userId",
                    "as": "useraccdetail"
                }
            },
            {
                "$unwind": "$useraccdetail"
            },
            {
                "$project": {
                    _id: 0,
                    userId: '$_id',
                    firstname: 1,
                    dob: 1,
                    gender: 1,
                    phone: 1,
                    email: 1,
                    address: 1,
                    city: 1,
                    state: 1,
                    zip: 1,
                    agentName: '$agentDetail.agent_name',
                    userAccount: {
                        account_name: '$useraccdetail.account_name',
                        account_type: '$useraccdetail.account_type'
                    },
                    PolicyCarrier: '$policycarrier.company_name',
                    PolicyInfo: {
                        policy_mode: "$policyinfo.policy_mode",
                        "policy_number": "$policyinfo.policy_number",
                        "premium_amount": "$policyinfo.premium_amount",
                        "policy_type": "$policyinfo.policy_type",
                        "company_name": "$policyinfo.company_name",
                        "category_name": "$policyinfo.category_name",
                        "policy_start_date": "$policyinfo.policy_start_date",
                        "policy_end_date": "$policyinfo.policy_end_date",
                        "csr": "$policyinfo.csr",
                    }
                }
            }
        ]).then(userDetail => {
            return Response.successResponse(userDetail)
        })
    }

    getAggregatedPolicy(userId) {
        return PolicyInfo.findOne({
            userId
        }, {
            policy_mode: 1,
            policy_number: 1,
            premium_amount: 1
        }).then(res => {
            return Response.successResponse(res)
        })
    }

    getMsg(message, dateTime) {
        return MsgDump.create({
            message,
            dateTime
        }).then(() => {
            return Response.successResponse('Message added successfully')
        })
    }

    insertMsg() {
        const cronJob = cron.job("* * * * * *", () => {
            console.log('Scheduler started')
            return MsgDump.find({}).lean()
            .then(data => {
                return Promise.map(data, (res) => {
                    if(res.dateTime === new Date()) {
                        return Message.create({
                            _id: `${idMap.user}-${uuidv4()}`,
                            message: res.message
                        }).then(() => {
                            return Response.successResponse('Message added successfully')
                        })
                    }
                    
                })
            })
        });
        cronJob.start();
    }

}

module.exports = new TaskService();