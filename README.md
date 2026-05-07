**PDF Generator System Overview**

Our PDF Generator system is a robust solution designed to streamline the creation of single or multiple PDFs through HTTP requests, offering efficiency, reliability, and real-time progress updates. Here's a detailed breakdown:

1. **Efficient Processing:**
   - **Single and Multiple PDF Generation:** Users can generate one or multiple PDFs with a single request. For multiple PDFs, the system zips them into a single response, reducing the number of HTTP requests and simplifying client handling.

2. **Fault-Tolerant and Scalable Architecture:**
   - **Fault Tolerance:** The system is designed to handle failures gracefully, ensuring continuous operation even if components fail. This redundancy ensures reliability.
   - **Scalability:** Capable of handling increased traffic by distributing resources through load balancing or distributed computing, making it suitable for growing applications.

3. **Real-Time Progress Updates:**
   - **WebSocket Integration:** Utilizes WebSocket connections to provide live updates on PDF generation progress. Clients receive real-time feedback, enhancing user experience and transparency.

4. **Features and Functionality:**
   - **Multiple Input Formats:** Supports various data structures or templates for flexibility in input.
   - **Error Handling and Reporting:** Provides detailed error messages for troubleshooting.
   - **Security Measures:** Includes authentication for WebSocket connections and HTTP requests to ensure secure access.
   - **Integration Capabilities:** Offers API endpoints for seamless integration into applications, catering to developers needing programmatically generated PDFs.

5. **Use Cases:**
   - Ideal for businesses requiring bulk report generation, such as invoices or receipts, or dynamic content creation in web and mobile applications.

6. **Why Choose Our System?**
   - **Enhanced Efficiency:** Reduces the number of HTTP requests with zipped multiple PDFs.
   - **Reliability:** Ensures uninterrupted service with fault-tolerant design.
   - **User-Friendly:** Real-time progress updates via WebSocket provide a superior user experience.

This system is tailored for developers and businesses seeking a reliable, scalable solution for generating PDFs programmatically. Whether for small-scale projects or large enterprises, it offers the flexibility and performance needed to meet diverse requirements.


-------------------------------------------------------------

This service accepts HTTP requests with JSON payloads and creates PDFs from it.

For single JSON - it returns downloadable PDF.
For multiple JSON it returns zip file of all the pdfs.

## How to build
Change the docker-compose.yaml credentials in the way required or add .env file 

Build and run the service
```shell
docker-compose up
```

Stopping the service
```shell
docker-compose down
```
- Data are stored in volumes, so bringing down the system won't loss any data.
- Migrate will auto run at the time of startup to keep the db updated it will stop once done automatically.

## Walkthrough of the service

### API to send a request to generate PDF.
```shell
# single pdf
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -d '{
        "title": "User Info",
        "name": "Shubham Kumar",
        "skills": ["Node.js", "Golang"]
      }'
```

```shell
# Multiple pdfs
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -d '[
        { "name": "A", "age": 25 },
        { "name": "B", "age": 30 }
      ]'

```

### Response from server
```json

{
    'jobId': '30710d35-df3d-41ad-bc7c-d2471e19ff5e'
}
```

### Progress of a job can be followed at
```url
ws://localhost:3000/ws/?jobId=a513909a-b139-4435-b730-8bcfea75a2d1
```
### Response from websocket
```json
{
    "jobId": "a513909a-b139-4435-b730-8bcfea75a2d1",
    "status": "processing",
    "progress": 99
}
```
```json
{
    "jobId": "a513909a-b139-4435-b730-8bcfea75a2d1",
    "status": "completed",
    "downloadUrl": "/download/a513909a-b139-4435-b730-8bcfea75a2d1"
}
```

Once done can be download with the given URL endpoint.

## Structure of overall architecture

![Overall_architecture](docs/Overall_architecture.png)

## Design of PDF Generator
![PDF Generator](docs/PDF%20Generator.png)

## Future Tasks
- For each pdf, adding tamper proof solution so nobody can forge it.


## Approach and other questions
[click here](./APPROACH.md)
