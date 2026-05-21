import boto3

kb_id = 'UXAFF3UKTQ'
client = boto3.client('bedrock-agent', region_name='ap-northeast-2')

response = client.list_data_sources(
    knowledgeBaseId=kb_id,
    maxResults=10
)

for ds in response.get('dataSourceSummaries', []):
    ds_id = ds['dataSourceId']
    ds_name = ds['name']
    
    # Get details
    detail = client.get_data_source(
        knowledgeBaseId=kb_id,
        dataSourceId=ds_id
    )
    
    s3_config = detail['dataSource']['dataSourceConfiguration'].get('s3Configuration')
    if s3_config:
        print(f"Data Source Name: {ds_name}")
        print(f"S3 Bucket ARN: {s3_config['bucketArn']}")
        print(f"Inclusion Prefixes: {s3_config.get('inclusionPrefixes', [])}")
        print("---")
