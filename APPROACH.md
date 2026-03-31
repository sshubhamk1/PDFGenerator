# Approach Document

## Initial Understanding
Q1.  **Before using any AI tools or doing research, what was your initial read of this problem? What did you think the hard parts were?**

The problem was simply to create a program which accepts the JSON payload and template and Generate a PDF from it. 
- I've done this earlier with weasyprint (in Django) but this time I've to do using puppeteer, so problem statement wise not a problem to me.
- For single file response is traditional but for the multiple file response should be a zip, not that complicated can be done easily.
- Single file max ize ~1 MB, multi file ~100MB(zipped may reduce it to 50-80)MB
- Concurrent request load was ~1000req/min for single and 5-10 for bulk, this statement seemed tough as most of the part of generation is not owned by the system but by the third party (chromium and puppeteer).
- Existing infra is monolith Django framework, it means we don't have to care about the auth as all of those will be taken care by the primary server itself.
- Variable Document Complexity: This OOM error give me hint to go toward Buffered stream approach and also to go with Golang instead of Django.
- Unreliable Client Connectivity: I won't do direct response as it might make the response hung in case of mulit-pdf , I'll start the process and keep notifying untill done properly.
- Data Consistency: I should not request to DB everytime the worker start creating the PDF as data may get updated, better I'll fetch required data at a point and store it in redis or somewhere else and use it to process all the PDFs. Also somewhere I've to write the time when it was fetch to avoid conflicts later.
- Tamper Evidence: I've to use my keys to sign it somewhere so that similar can't be created witout my keys, or will lookup into LLM for other better options.
- Budget Constraint: I'll prepare based on the conditions and then after doing benchmark I'll think about tackling costs. Seeing budget and monthly uses, based will be to use a small instance of EC2 and schedule the tasks as a queue as for most of the time it will be idle, I'll share the exact calculation later.


## 2. Assumptions & Clarifying Questions
Q. **List any assumptions you made. In a real scenario, what questions would you ask the product team or engineering lead before starting?**
- Will user be able to cancel the job his in between? (It is good to have, for simplicity, I'm removing it for now)
- If a job is not processed yet, and the same user puts new request shall we process it or not? (Assuming he might need data from this snapshot, we should take as a new request)


## 3. Capacity Planning & Math
Q. **Show your calculations. How did you arrive at your resource
requirements? Consider: memory, CPU, storage, network bandwidth, queue depth.**

[Your response here]
## 4. Design Decisions (minimum 3)
> For each major decision, document:
> - What alternatives you considered
> - Why you chose the approach you did
> - What tradeoff you're accepting
### Decision 1: [Title]
**Alternatives considered:**
**Chosen approach:**
**Why:**
**Tradeoff accepted:**
### Decision 2: [Title]

### Decision 3: [Title]
...
## 5. AI Usage Log
> Public links of conversations you had with AI.
## 6. Weaknesses & Future Improvements
> What is the weakest part of your design? If you had 2 more days, what
would you
> improve? What would you change if this needed to support 10x the load?
[Your response here]
## 7. One Thing the Problem Statement Didn't Mention
> What's something important for a production deployment that wasn't
called out in the
> requirements? Why does it matter?
[Your response here]
## 8. Cost Estimation
Provide a line-by-line monthly cost breakdown for your proposed
infrastructure.
Show your math. We care more about the reasoning than the exact numbers.