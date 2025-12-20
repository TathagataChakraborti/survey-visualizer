FROM python:3

WORKDIR /PROJECT


COPY dsharp /bin/dsharp
RUN chmod 777 /bin/dsharp

COPY . .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask-cors --upgrade
RUN pip install gunicorn==20.0.4
RUN rm dsharp

EXPOSE 1234
CMD ["gunicorn", "--workers", "3", "-b", "0.0.0.0:1234", "server:app"]
