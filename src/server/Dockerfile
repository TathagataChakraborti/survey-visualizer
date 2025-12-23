FROM python:3

WORKDIR /PROJECT


COPY dsharp /bin/dsharp
RUN chmod 777 /bin/dsharp

COPY . .

RUN pip install --no-cache-dir -r requirements.txt
RUN rm dsharp

EXPOSE 1234

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "1234"]
