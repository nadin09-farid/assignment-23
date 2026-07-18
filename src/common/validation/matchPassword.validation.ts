import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchConfirmPassword', async: false })
export class MatchTwoFields implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    console.log({ value, args, constraints: args.constraints });

    return value == args.object[args.constraints[0]];
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} doesnot match ${args.constraints[0]}`;
  }
}

export function IsMatch(
  fieldName: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: fieldName,
      validator: MatchTwoFields,
    });
  };
}
