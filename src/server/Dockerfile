FROM python:3

WORKDIR /PROJECT


COPY dsharp /bin/dsharp
RUN chmod 777 /bin/dsharp

COPY . .

RUN pip install -r requirements.txt
RUN rm dsharp

CMD /bin/bash

ENTRYPOINT [ "python" ]
CMD [ "server.py" ]
