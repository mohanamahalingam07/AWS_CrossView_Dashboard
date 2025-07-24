import boto3
import json
import datetime

# List of AWS accounts to assume role into
accounts = [
    '# Account A',  
    '# Account B',  
    # Add more account IDs if needed
] 

ROLE_NAME = 'CrossAccountReadRole'

def assume_role(account_id, role_name):
    sts_client = boto3.client('sts')
    try:
        response = sts_client.assume_role(
            RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
            RoleSessionName='CrossAccountSession'
        )
        creds = response['Credentials']
        session = boto3.Session(
            aws_access_key_id=creds['AccessKeyId'],
            aws_secret_access_key=creds['SecretAccessKey'],
            aws_session_token=creds['SessionToken']
        )
        return session
    except Exception as e:
        return str(e)

def get_ec2_instances(session):
    try:
        ec2_client = session.client('ec2')
        instances_info = []
        reservations = ec2_client.describe_instances()['Reservations']
        for res in reservations:
            for inst in res['Instances']:
                instances_info.append({
                    'InstanceId': inst['InstanceId'],
                    'InstanceType': inst['InstanceType'],
                    'State': inst['State']['Name'],
                    'Region': ec2_client.meta.region_name
                })
        return instances_info
    except Exception as e:
        return {'error': str(e)}

def get_cost_data(session):
    try:
        ce_client = session.client('ce', region_name='us-east-1')
        today = datetime.date.today()
        start = today.replace(day=1).isoformat()
        end = today.isoformat()
        result = ce_client.get_cost_and_usage(
            TimePeriod={'Start': start, 'End': end},
            Granularity='MONTHLY',
            Metrics=['UnblendedCost']
        )
        return result['ResultsByTime'][0]['Total']['UnblendedCost']['Amount']
    except Exception as e:
        return f"Cost Error: {e}"

def lambda_handler(event, context):
    results = {}

    for account_id in accounts:
        session = assume_role(account_id, ROLE_NAME)
        if isinstance(session, str):
            results[account_id] = {'error': session}
            continue

        ec2_info = get_ec2_instances(session)
        cost_info = get_cost_data(session)

        results[account_id] = {
            'EC2': ec2_info,
            'CostUSD': cost_info
        }

    # ✅ CORS headers
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',  # Or restrict to 'http://localhost:5173'
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(results)
    }
