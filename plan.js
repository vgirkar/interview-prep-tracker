// Plan data for the interview prep tracker. This file is the single source of truth:
// index.html loads it before app.js, and scripts/daily-email.mjs reads the section
// between the two markers below to build the morning and evening emails.

/* ---------- plan ---------- */
var START=new Date(2026,11,5), DAYS=98, WEEKS=14, DSA_DAYS=95, MS=86400000;
var WMAP=[0,1,2,3,4,5,6,6,7,8,9,10,11,12,13,14,14];
function I(id,t,w){return {id:id,t:t,w:WMAP[w]};}
function G(name,items){return {name:name,items:items};}

var TRACKS=[
{id:'dsa',name:'DSA',intro:'Sections of the A2Z sheet, in the order that suits interviews. Tick a section when every problem in it is done on TUF+, and log your daily solved count on the Today page.',groups:[
 G('Step 1: Learn the basics',[I('d1_1','Things to know in your language',1),I('d1_2','Build up logical thinking (patterns)',1),I('d1_3','Learn the standard library and collections',1),I('d1_4','Basic maths',1),I('d1_5','Basic recursion',1),I('d1_6','Basic hashing',1)]),
 G('Step 2: Sorting techniques',[I('d2_1','Sorting I',1),I('d2_2','Sorting II',1)]),
 G('Step 3: Arrays',[I('d3_1','Easy',1),I('d3_2','Medium',2),I('d3_3','Hard',2)]),
 G('Step 4: Binary search',[I('d4_1','Binary search on 1D arrays',3),I('d4_2','Binary search on answers',3),I('d4_3','Binary search on 2D arrays',3)]),
 G('Step 6: Linked lists',[I('d6_1','Learn singly linked lists',4),I('d6_2','Learn doubly linked lists',4),I('d6_3','Medium problems, singly linked',4),I('d6_4','Medium problems, doubly linked',4),I('d6_5','Hard problems',4)]),
 G('Step 9: Stacks and queues',[I('d9_1','Learning',5),I('d9_2','Prefix, infix and postfix conversion',5),I('d9_3','Monotonic stack and queue problems',5),I('d9_4','Implementation problems',5)]),
 G('Step 10: Sliding window and two pointers',[I('d10_1','Medium problems',6),I('d10_2','Hard problems',6)]),
 G('Step 13: Binary trees',[I('d13_1','Traversals',6),I('d13_2','Medium problems',7),I('d13_3','Hard problems',7)]),
 G('Step 14: Binary search trees',[I('d14_1','Concepts',8),I('d14_2','Practice problems',8)]),
 G('Step 11: Heaps',[I('d11_1','Learning',8),I('d11_2','Medium problems',8),I('d11_3','Hard problems',8)]),
 G('Step 15: Graphs',[I('d15_1','Learning',9),I('d15_2','BFS and DFS problems',9),I('d15_3','Topological sort and problems',9),I('d15_4','Shortest path algorithms and problems',10),I('d15_5','Minimum spanning tree and disjoint set',10),I('d15_6','Other algorithms',10)]),
 G('Step 7: Recursion',[I('d7_1','Get a strong hold',11),I('d7_2','Subsequences pattern',11),I('d7_3','Trying out all combinations, hard',11)]),
 G('Step 5: Strings, basic and medium',[I('d5_1','Basic and easy problems',11),I('d5_2','Medium problems',11)]),
 G('Step 16: Dynamic programming',[I('d16_1','Introduction',12),I('d16_2','1D DP',12),I('d16_3','2D and 3D DP, DP on grids',12),I('d16_4','DP on subsequences',12),I('d16_5','DP on strings',13),I('d16_6','DP on stocks',13),I('d16_7','DP on longest increasing subsequence',13),I('d16_8','Partition DP',13),I('d16_9','DP on squares',13)]),
 G('Step 12: Greedy',[I('d12_1','Easy problems',14),I('d12_2','Medium and hard problems',14)]),
 G('Step 8: Bit manipulation',[I('d8_1','Learn bit manipulation',14),I('d8_2','Interview problems',14),I('d8_3','Advanced maths',14)]),
 G('Step 17: Tries',[I('d17_1','Theory',15),I('d17_2','Problems',15)]),
 G('Step 18: Strings, hard',[I('d18_1','Hard problems',15)]),
 G('Revision',[I('dr_1','Redo every problem marked for revision',15),I('dr_2','Three timed mixed sets, two problems in 60 minutes',16),I('dr_3','Two mock DSA interviews',16)])
]},
{id:'system-design',name:'System design',intro:'Fundamentals first, then one classic design a week, written out rather than read.',groups:[
 G('Fundamentals',[I('s01','Scaling basics: load balancing, caching, CDNs',1),I('s02','Databases: SQL and NoSQL, indexing',1),I('s03','Replication, partitioning and sharding',2),I('s04','CAP theorem and consistency models',2),I('s05','Message queues and event-driven design',3),I('s06','API design: REST, gRPC, pagination, idempotency',3),I('s07','Consistent hashing',4),I('s08','Back-of-envelope estimation',4)]),
 G('Classic designs',[I('s10','URL shortener',2),I('s11','Rate limiter',3),I('s12','News feed',4),I('s13','Chat system',5),I('s14','Notification system',6),I('s15','Payments system',7),I('s16','Search autocomplete',8),I('s17','Web crawler',9),I('s18','Video streaming',10),I('s19','Ride hailing',11),I('s20','File storage and sync',12),I('s21','Ticket booking',13),I('s22','Distributed cache',13),I('s23','Job scheduler',14),I('s24','Metrics and monitoring',14)]),
 G('Mock interviews',[I('s30','Mock design interview 1',8),I('s31','Mock design interview 2',11),I('s32','Mock design interview 3',14),I('s33','Mock design interview 4',15),I('s34','Mock design interview 5',16)])
]},
{id:'lld',name:'LLD and machine coding',intro:'Patterns in Python, then classic problems, then timed 90-minute rounds on Saturdays. A round counts only if the code runs.',groups:[
 G('Foundations',[I('l01','SOLID principles',1),I('l02','OOP in Python: abstract base classes, dataclasses, enums',1),I('l03','Class diagrams and thinking aloud',2)]),
 G('Design patterns',[I('l04','Strategy',2),I('l05','Factory',2),I('l06','Observer',3),I('l07','State',3),I('l08','Decorator',4),I('l09','Builder',4),I('l10','Singleton',4)]),
 G('LLD problems',[I('l11','Parking lot',3),I('l12','LRU cache',4),I('l13','Vending machine',5),I('l14','Logger framework',6),I('l15','Movie ticket booking',7),I('l16','Tic-tac-toe',8),I('l17','Snake and ladder',9),I('l18','Library management',10),I('l19','Notification service',11),I('l20','Elevator',12)]),
 G('Machine coding, timed 90 minutes',[I('m01','Splitwise',2),I('m02','Elevator system',4),I('m03','Rate limiter',5),I('m04','Booking system',6),I('m05','In-memory key-value store',7),I('m06','Snake and ladder',8),I('m07','Parking lot',9),I('m08','Task scheduler',10),I('m09','Food ordering',11),I('m10','Pub-sub system',12),I('m11','Cab booking',13),I('m12','Your weakest round, redone',14),I('m13','Unseen problem, timed',15),I('m14','Unseen problem, timed',16)])
]},
{id:'behavioural',name:'Behavioural',intro:'Write each answer once, then say it aloud until it takes two minutes or less.',groups:[
 G('Core answers',[I('b01','Tell me about yourself, in 60 seconds',1),I('b02','Why you’re leaving your current role',1),I('b05','Walk through your resume in three minutes',2),I('b03','Why this company and this role',2),I('b04','Strengths and one real weakness',3)]),
 G('Stories, in STAR format',[I('b10','A project you owned end to end',1),I('b11','The hardest technical problem you solved',2),I('b12','A conflict with a teammate or stakeholder',3),I('b13','A failure and what you changed after it',4),I('b14','Delivering against a tight deadline',5),I('b15','Disagreeing with a decision',6),I('b16','Leading or mentoring others',7),I('b17','Working through ambiguity',8),I('b18','Going further for a customer or user',9),I('b19','A decision with real trade-offs',10)]),
 G('Closing the loop',[I('b20','Questions to ask interviewers',4),I('b21','Answers on salary and notice period',5),I('b22','Offer negotiation plan',10)]),
 G('Practice',[I('b30','Record yourself telling every story',6),I('b31','Mock behavioural interview 1',9),I('b32','Mock behavioural interview 2',13),I('b33','Full run-through of every answer',15)])
]},
{id:'ai',name:'AI rounds',intro:'Theory questions, the AI coding round, GenAI system design, and the Python and backend questions that tech rounds draw from your resume.',groups:[
 G('Theory',[I('a01','Transformers and attention',1),I('a02','Tokenisation and context windows',1),I('a03','Sampling: temperature, top-p, top-k',2),I('a04','Embeddings and similarity',2),I('a05','Prompting: few-shot, chain of thought, structured outputs',3),I('a06','RAG pipeline, end to end',3),I('a07','Chunking strategies',4),I('a08','Vector databases and ANN indexes (HNSW, IVF)',4),I('a09','Hybrid search and reranking',5),I('a10','RAG evaluation: faithfulness, relevance, recall',5),I('a11','LLM evals and LLM-as-judge',6),I('a12','Function calling and tool use',6),I('a13','Agents: ReAct, planning, memory',7),I('a14','Multi-agent orchestration and state',7),I('a15','Model Context Protocol',8),I('a16','Fine-tuning versus RAG, LoRA and PEFT',8),I('a17','Quantisation and model serving',9),I('a18','Cost and latency levers: caching, routing, streaming',9),I('a19','Guardrails and prompt injection',10),I('a20','Hallucination: causes and controls',10),I('a21','Observability and tracing for LLM apps',11),I('a22','ML basics: bias and variance, overfitting, precision and recall',11),I('a23','Voice pipelines: speech-to-text, text-to-speech, turn-taking',12)]),
 G('AI coding round',[I('c01','Cosine similarity and top-k retrieval from scratch',2),I('c02','Text chunker with overlap',3),I('c03','BM25 from scratch',4),I('c04','Mini RAG pipeline, end to end',5),I('c05','Tool-calling agent loop without a framework',6),I('c06','Streaming chat endpoint in FastAPI',7),I('c07','Async batch LLM caller with retries and backoff',8),I('c08','Structured output parser with validation and retry',9),I('c09','Cache for LLM calls, exact and semantic',10),I('c10','Token-budgeted conversation memory',11),I('c11','Eval harness for a RAG system',12),I('c12','Self-attention in NumPy',13)]),
 G('GenAI system design',[I('g01','RAG system at scale',5),I('g02','Agent workflow platform',7),I('g03','LLM evals and monitoring',9),I('g04','Voice agent pipeline',10),I('g05','Customer support bot with guardrails',11),I('g06','Multi-tenant document Q&A',12),I('g07','LLM gateway: routing, caching, rate limits',13),I('g08','Semantic search over a large catalogue',14)]),
 G('Company question bank',[I('q01','Question bank: LLM internals and architecture',2),I('q02','Question bank: RAG and retrieval',4),I('q03','Question bank: agents and tool use',6),I('q04','Question bank: evaluation and observability',7),I('q05','Question bank: fine-tuning, post-training and alignment',9),I('q06','Question bank: inference, serving and GPU performance',10),I('q07','Question bank: safety, security and responsible AI',11),I('q08','Question bank: AI system design',12),I('q09','Question bank: coding and data structures',13),I('q10','Question bank: multimodal, speech and voice AI',14)]),
 G('Python and backend',[I('p01','GIL, threads and multiprocessing',1),I('p02','asyncio and the event loop',2),I('p03','Generators, iterators and decorators',3),I('p04','Context managers and memory management',4),I('p05','FastAPI: dependency injection, async, Pydantic',5),I('p06','Auth: JWT and OAuth',6),I('p07','SQL: joins and window functions',7),I('p08','SQL: indexing, transactions, isolation',8),I('p09','Caching and idempotency',9),I('p10','Docker and CI/CD',10),I('p11','The AWS services you’ve used',11)]),
 G('Project deep-dives',[I('j01','RAG project: defend every decision',6),I('j02','Agent project: defend every decision',8),I('j03','Voice project: defend every decision',10),I('j04','Full resume walk-through, aloud',14)])
]}
];
var TABS=[['today','Today'],['dsa','DSA'],['system-design','System design'],['lld','LLD and machine coding'],['behavioural','Behavioural'],['applications','Applications'],['ai','AI rounds'],['weekly-test','Weekly tests']];
var STATUSES=['Applied','Recruiter call','Online test','Interviewing','Offer','Rejected','No reply'];
var CLOSED={'Offer':1,'Rejected':1,'No reply':1};
var APP_WEEKLY=5;
var HOURS_DAY=6;
var TRACK_LINKS={
 'dsa':[['The A2Z sheet on takeUforward','https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/']],
 'system-design':[['System Design in a Hurry, by Hello Interview','https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction'],['The System Design Primer','https://github.com/donnemartin/system-design-primer']],
 'lld':[['Design patterns in Python, by Refactoring.Guru','https://refactoring.guru/design-patterns/python'],['Pattern code examples in Python','https://github.com/refactoringguru/design-patterns-python']],
 'ai':[['The Illustrated Transformer','https://jalammar.github.io/illustrated-transformer/'],['Building effective agents, by Anthropic','https://www.anthropic.com/engineering/building-effective-agents'],['AI engineering interview questions, company by company','https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise#common-questions-asked-across-companies']]
};
var RG=['Refactoring.Guru guide','https://refactoring.guru/design-patterns/python'],SDP=['System Design Primer','https://github.com/donnemartin/system-design-primer'],BEA=['Building effective agents','https://www.anthropic.com/engineering/building-effective-agents'];
var LINKS={l01:['SOLID in Python, on Real Python','https://realpython.com/solid-principles-python/'],l04:RG,l05:RG,l06:RG,l07:RG,l08:RG,l09:RG,l10:RG,s01:SDP,s02:SDP,s03:SDP,s04:SDP,s07:SDP,s08:SDP,a01:['The Illustrated Transformer','https://jalammar.github.io/illustrated-transformer/'],a13:BEA,a14:BEA};
var QB='https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise';
[['q01','llm-internals-and-architecture'],['q02','rag-and-retrieval'],['q03','agents-and-tool-use'],['q04','evaluation-and-observability'],['q05','fine-tuning-post-training-and-alignment'],['q06','inference-serving-and-gpu-performance'],['q07','safety-security-and-responsible-ai'],['q08','ai-system-design'],['q09','coding-and-data-structures'],['q10','multimodal-speech-and-voice-ai']].forEach(function(x){LINKS[x[0]]=['Questions and answers on GitHub',QB+'#'+x[1]];});
var QTRACK={'dsa':['Striver A2Z ',''],'system-design':['',' system design interview'],'lld':['',' low level design'],'behavioural':['',' interview answer'],'ai':['',' explained']};
var QGROUP={'Company question bank':null,'Revision':null,'Mock interviews':null,'Practice':null,'Project deep-dives':null,'Foundations':['',' Python'],'Design patterns':['',' design pattern Python'],'Machine coding, timed 90 minutes':['',' machine coding round'],'AI coding round':['',' Python implementation'],'GenAI system design':['',' GenAI system design interview'],'Python and backend':['',' interview questions']};
var NOQ={m12:1,m13:1,m14:1};
TRACKS.forEach(function(t){t.groups.forEach(function(g){
  var q=g.name in QGROUP?QGROUP[g.name]:QTRACK[t.id],topic=g.name.indexOf('Step ')===0?g.name.split(': ').slice(1).join(': ')+' ':'';
  g.items.forEach(function(it){if(topic)it.full=topic+'– '+it.t.charAt(0).toLowerCase()+it.t.slice(1);it.q=q&&!NOQ[it.id]?q[0]+topic+it.t+q[1]:'';});
});});
var DAYSETS={'system-design':[1,3,5],'lld':[2,4,6],'behavioural':[1,3,5,6],'ai':[1,2,3,4,5,6]};
TRACKS.forEach(function(t){
  var byWeek={};
  t.groups.forEach(function(g){g.items.forEach(function(it){
    var base=(it.w-1)*7;
    if(g.name.indexOf('Machine coding')===0){it.d0=it.d=base;return;}
    if(g.name==='Mock interviews'){it.d0=it.d=base+1;return;}
    (byWeek[it.w]=byWeek[it.w]||[]).push(it);
  });});
  Object.keys(byWeek).forEach(function(w){
    var list=byWeek[w],n=list.length,base=(w-1)*7,set=DAYSETS[t.id];
    list.forEach(function(it,k){
      if(set){it.d0=it.d=base+set[Math.floor(k*set.length/n)];}
      else{it.d0=base+Math.floor(k*7/n);it.d=Math.max(it.d0,base+Math.floor((k+1)*7/n)-1);}
    });
  });
});
var SPLIT=[['DSA, from the A2Z sheet','3 hours','dsa'],['System design or LLD, on alternate days','1 hour 15 minutes','system-design'],['AI rounds','1 hour','ai'],['Behavioural and applications','45 minutes','applications']];

/* ---------- dates ---------- */
