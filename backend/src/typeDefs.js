import { gql } from 'apollo-server-express';
export default gql`
  type User { id:ID! email:String! role:String! createdAt:String! }
  type AuthPayload { token:String! }
  type Tool {
    id:ID! name:String! category:String! description:String! free:Boolean!
    lang:[String!]! rating:Float! tags:[String!]! img:String site:String!
    createdAt:String!
  }
  type News { id:ID! title:String! summary:String! content:String! img:String createdAt:String! }
  type Scheduler {
    id:ID! name:String! url:String! cronExpression:String! isActive:Boolean!
    dataType:String! lastRun:String nextRun:String status:String! errorMessage:String
    createdAt:String! updatedAt:String!
  }
  type PageInfo { total:Int! hasMore:Boolean! }
  type ToolPage { items:[Tool!]! pageInfo:PageInfo! }
  type NewsPage { items:[News!]! pageInfo:PageInfo! }
  type SchedulerPage { items:[Scheduler!]! pageInfo:PageInfo! }
  type Query {
    me:User
    tools(q:String,category:String,free:Boolean,lang:String,skip:Int=0,take:Int=12,orderBy:String="createdAt",order:String="desc"):ToolPage!
    tool(id:ID!):Tool
    news(q:String,skip:Int=0,take:Int=10,orderBy:String="createdAt",order:String="desc"):NewsPage!
    newsItem(id:ID!):News
    schedulers(skip:Int=0,take:Int=10):SchedulerPage!
    scheduler(id:ID!):Scheduler
  }
  input ToolInput {
    name:String! category:String! description:String! free:Boolean!
    lang:[String!]! rating:Float tags:[String!]! img:String site:String!
  }
  input NewsInput { title:String! summary:String! content:String! img:String }
  input SchedulerInput {
    name:String! url:String! cronExpression:String! isActive:Boolean!
    dataType:String!
  }
  type Mutation {
    register(email:String!,password:String!):AuthPayload!
    login(email:String!,password:String!):AuthPayload!
    addTool(input:ToolInput!):Tool!
    updateTool(id:ID!,input:ToolInput!):Tool!
    deleteTool(id:ID!):Boolean!
    addNews(input:NewsInput!):News!
    updateNews(id:ID!,input:NewsInput!):News!
    deleteNews(id:ID!):Boolean!
    uploadLogo(fileName:String!, url:String!):String!
    addScheduler(input:SchedulerInput!):Scheduler!
    updateScheduler(id:ID!,input:SchedulerInput!):Scheduler!
    deleteScheduler(id:ID!):Boolean!
    runScheduler(id:ID!):Boolean!
  }
`;
